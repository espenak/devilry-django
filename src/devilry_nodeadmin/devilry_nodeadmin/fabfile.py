from fabric.api import local, task

@task
def makemessages(langcode):
    local(('../../../devenv/bin/django_dev.py makemessages -d djangojs -l {0} '
           '-i "static/devilry_subjectadmin/app-all.js" '
           '-i "static/devilry_subjectadmin/all-classes.js"'
          ).format(langcode))
    #local(('../../../devenv/bin/django_dev.py makemessages -l {0}').format(langcode))


@task
def compilemessages():
    local('../../../devenv/bin/django_dev.py compilemessages')
