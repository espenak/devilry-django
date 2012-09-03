from django import forms
from djangorestframework.permissions import IsAuthenticated
from djangorestframework.views import View
from djangorestframework.resources import FormResource

from devilry.apps.core.models import AssignmentGroup
from .auth import IsAssignmentAdmin
from .errors import NotFoundError


class MergeIntoGroupForm(forms.Form):
    source_group_id = forms.IntegerField(required=True)
    target_group_id = forms.IntegerField(required=True)

class MergeIntoGroupResource(FormResource):
    form = MergeIntoGroupForm


class MergeIntoGroup(View):
    """
    REST API for the ``merge_into`` method of ``devilry.apps.code.models.AssignmentGroup``.

    # POST
    Merge a group (called source) into another group (called target).

    ## Parameters
    The assignment ID is the last part of the URL.
    The following parameters must be part of the request body:

    - ``source_group_id`` (int): The ID of the source group.
    - ``target_group_id`` (int): The ID of the target group.

    ## Response
    Responds with status code ``200`` and an object/map with the following
    attributes on success:

    - ``success`` (bool): Always ``true``.
    - ``source_group_id`` (int): The ID of the source group.
    - ``target_group_id`` (int): The ID of the target group.

    On error, we respond with:

    - Errorcode ``400`` if any of the parameters are missing or wrong.
    - Errorcode ``403`` for permission denied.
    - Errorcode ``404`` if one of the group IDs are not found within the assignment.
    """
    permissions = (IsAuthenticated, IsAssignmentAdmin)
    resource = MergeIntoGroupResource

    def _get_group(self, group_id):
        try:
            return AssignmentGroup.objects.get(parentnode=self.assignment_id,
                                         id=group_id)
        except AssignmentGroup.DoesNotExist:
            raise NotFoundError(('Group with assignment_id={assignment_id} and '
                                 'id={group_id} not found').format(assignment_id=self.assignment_id,
                                                                   group_id=group_id))

    def post(self, request, id):
        self.assignment_id = id
        source_group_id = self.CONTENT['source_group_id']
        target_group_id = self.CONTENT['target_group_id']
        source = self._get_group(source_group_id)
        target = self._get_group(target_group_id)
        new_group = source.merge_into(target)
        return {'success': True,
                'source_group_id': source_group_id,
                'target_group_id': target_group_id}
