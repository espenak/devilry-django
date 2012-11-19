from djangorestframework.views import View
from djangorestframework.permissions import IsAuthenticated

from devilry.apps.core.models import AssignmentGroup
from devilry.apps.core.models import Period
from devilry.apps.core.models import RelatedStudent
from devilry.apps.core.models import RelatedStudentKeyValue



class AggregatePeriod(View):
    """
    Get detailed data for all students on a period, including their labels.
    """
    permissions = (IsAuthenticated,)

    def _serialize_user(self, user):
        return {'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.devilryuserprofile.full_name}

    def _serialize_relatedstudent(self, relatedstudent):
        return {'id': relatedstudent.id,
                'tags': relatedstudent.tags,
                'candidate_id': relatedstudent.candidate_id,
                'labels': []
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
                'is_open': group.is_open,
                'assignment_id': group.parentnode_id,
                'feedback': self._serialize_feedback(group.feedback)}

    def _create_resultdict(self, user, relatedstudent=None, labels=None):
        resultdict = {'userid': user.id, # Needed by ExtJS since an object can not be idProperty on a model - does not hurt in any other cases even if it is also included in ``user``.
                      'user': self._serialize_user(user),
                      'relatedstudent': None,
                      'groups': []}
        if relatedstudent:
            resultdict['relatedstudent'] = self._serialize_relatedstudent(relatedstudent)
        return resultdict

    def _initialize_from_relatedstudents(self, period):
        relatedstudents = RelatedStudent.objects.filter(period=period)
        result = {}
        for relatedstudent in relatedstudents:
            result[str(relatedstudent.user.id)] = self._create_resultdict(relatedstudent.user, relatedstudent)
        return result

    def _add_labels(self, period, result):
        keyvalues = RelatedStudentKeyValue.objects.filter(relatedstudent__period=period,
                                                          application='devilry.statistics.Labels')
        keyvalues = keyvalues.select_related('relatedstudent')
        for keyvalue in keyvalues:
            userdct = result[str(keyvalue.relatedstudent.user_id)]
            userdct['relatedstudent']['labels'].append(keyvalue.key)


    def _add_groups(self, period, result):
        groups = AssignmentGroup.objects.filter(parentnode__parentnode=period)
        groups = groups.order_by('parentnode__publishing_time')
        for group in groups:
            groupdct = self._serialize_group(group)
            for candidate in group.candidates.all():
                user = candidate.student
                userkey = str(user.id)
                try:
                    userdct = result[userkey]
                except KeyError:
                    # NOTE: This means that we have a student registered on an assignment, but not on the period. These are not handled by the old Admin-ui, bu should be handled in the new.
                    #userdct = self._create_resultdict(user)
                    #result[userkey] = userdct
                    #userdct['groups'].append(groupdct) # note: use finally to DRY
                    pass
                else:
                    userdct['groups'].append(groupdct)

    def get(self, request, id):
        period = Period.objects.get(pk=id)
        # TODO: check permissions
        result = self._initialize_from_relatedstudents(period)
        self._add_labels(period, result)
        self._add_groups(period, result)
        return result.values()
