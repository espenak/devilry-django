from django.db.models import Q, Count
from djangorestframework.views import View
from djangorestframework.permissions import IsAuthenticated

from devilry.apps.core.models import Assignment
from devilry.apps.core.models import Period



class AggregatePeriod(View):
    """
    """
    permissions = (IsAuthenticated,)


    def get(self, request):
        return [1, 2]
