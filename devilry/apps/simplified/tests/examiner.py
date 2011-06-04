from django.test import TestCase
from django.contrib.auth.models import User

from ...core import models
from ..examiner import Subjects, Periods, Assignments, Groups


class TestExaminerSubjects(TestCase):
    fixtures = ["simplified/data.json"]

    def test_get(self):
        examiner0 = User.objects.get(username="examiner0")
        subjects = models.Subject.published_where_is_examiner(examiner0).order_by("short_name")
        qryset = Subjects.search(examiner0).qryset
        self.assertEquals(len(qryset), len(subjects))
        self.assertEquals(qryset[0].short_name, subjects[0].short_name)

        # query
        qryset = Subjects.search(examiner0, query="duck1").qryset
        self.assertEquals(len(qryset), 2)
        qryset = Subjects.search(examiner0, query="duck").qryset
        self.assertEquals(len(qryset), len(subjects))
        qryset = Subjects.search(examiner0, query="1100").qryset
        self.assertEquals(len(qryset), 1)

class TestExaminerPeriods(TestCase):
    fixtures = ["simplified/data.json"]

    def test_get(self):
        examiner0 = User.objects.get(username="examiner0")
        periods = models.Period.published_where_is_examiner(examiner0).order_by("short_name")
        qryset = Periods.search(examiner0).qryset
        self.assertEquals(len(qryset), len(periods))
        self.assertEquals(qryset[0].short_name, periods[0].short_name)

        # query
        qryset = Periods.search(examiner0, query="h01").qryset
        self.assertEquals(len(qryset), 3)
        qryset = Periods.search(examiner0, query="duck1").qryset
        self.assertEquals(len(qryset), 2)


class TestExaminerAssignments(TestCase):
    fixtures = ["simplified/data.json"]

    def test_get(self):
        examiner0 = User.objects.get(username="examiner0")
        all_assignments = models.Assignment.objects.all().order_by("short_name")
        qryset = Assignments.search(examiner0).qryset
        self.assertEquals(len(qryset), len(all_assignments))
        self.assertEquals(qryset[0].short_name, all_assignments[0].short_name)

        # query
        qryset = Assignments.search(examiner0, query="ek").qryset
        self.assertEquals(len(qryset), 9)
        qryset = Assignments.search(examiner0, query="h0").qryset
        self.assertEquals(len(qryset), len(all_assignments))
        qryset = Assignments.search(examiner0, query="1100").qryset
        self.assertEquals(len(qryset), 4)



class TestExaminerGroups(TestCase):
    fixtures = ["simplified/data.json"]

    def test_get(self):
        examiner0 = User.objects.get(username="examiner0")
        assignment = models.Assignment.published_where_is_examiner(examiner0)[0]

        qryset = Groups.search(examiner0, assignment.id,
                orderby=["-id"], limit=2).qryset
        self.assertEquals(assignment.id, qryset[0].parentnode.id)
        self.assertTrue(qryset[0].id > qryset[1].id)
        self.assertEquals(qryset.count(), 2)

        qryset = Groups.search(examiner0, assignment.id,
                query="student0").qryset
        self.assertEquals(qryset.count(), 1)
        qryset = Groups.search(examiner0, assignment.id,
                query="thisisatest").qryset
        self.assertEquals(qryset.count(), 0)

        g = Groups.search(examiner0, assignment.id).qryset[0]
        g.name = "thisisatest"
        g.save()
        qryset = Groups.search(examiner0, assignment.id,
                query="thisisatest").qryset
        self.assertEquals(qryset.count(), 1)
