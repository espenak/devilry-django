from django.db.models import Q, Count
from djangorestframework.views import View
from djangorestframework.permissions import IsAuthenticated

from devilry.apps.core.models import AssignmentGroup
from devilry.apps.core.models import Period
from devilry.apps.core.models import RelatedStudent



class AggregatePeriod(View):
    """
    Get detailed data for all students on a period, including their labels.
    """
    permissions = (IsAuthenticated,)

    def _get_resultkey_from_user(self, user):
        return str(user.id)

    def _serialize_user(self, user):
        return {'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.devilryuserprofile.full_name}

    def _serialize_relatedstudent(self, relatedstudent):
        return {'id': relatedstudent.id,
                'tags': relatedstudent.tags,
                'candidate_id': relatedstudent.candidate_id,
               }

    def _serialize_feedback(self, feedback):
        if feedback:
            return {'id': feedback.id,
                    'grade': feedback.grade,
                    'points': feedback.points,
                    'is_passing_grade': feedback.is_passing_grade,
                    'save_timestamp': feedback.save_timestamp}
        else:
            return None

    def _serialize_group(self, group):
        return {'id': group.id,
                'feedback': self._serialize_feedback(group.feedback)}

    def _create_resultdict(self, user, relatedstudent=None):
        resultdict = {'user': self._serialize_user(user),
                      'relatedstudent': None,
                      'groups': []}
        if relatedstudent:
            resultdict['relatedstudent'] = self._serialize_relatedstudent(relatedstudent)
        return resultdict

    def _initialize_from_relatedstudents(self, period):
        relatedstudents = RelatedStudent.objects.filter(period=period)
        result = {}
        for relatedstudent in relatedstudents:
            result[self._get_resultkey_from_user(relatedstudent.user)] = self._create_resultdict(relatedstudent.user, relatedstudent)
        return result

    def _merge_groups_into_relatedstudents(self, period, result):
        groups = AssignmentGroup.objects.filter(parentnode__parentnode=period)
        groups = groups.order_by('parentnode__publishing_time')
        for group in groups:
            groupdct = self._serialize_group(group)
            for candidate in group.candidates.all():
                user = candidate.student
                userkey = self._get_resultkey_from_user(user)
                try:
                    userdct = result[userkey]
                except KeyError:
                    # NOTE: This means that we have a student registered on an assignment, but not on the period.
                    userdct = self._create_resultdict(user)
                    result[userkey] = userdct
                userdct['groups'].append(groupdct)

    def get(self, request, id):
        period = Period.objects.get(pk=id)
        # TODO: check permissions
        result = self._initialize_from_relatedstudents(period)
        self._merge_groups_into_relatedstudents(period, result)
        return result.values()
