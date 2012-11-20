Ext.define('devilry.statistics.Loader', {
    extend: 'Ext.util.Observable',
    requires: [
        'devilry.extjshelpers.AsyncActionPool',
        'devilry.statistics.AggregatedPeriodDataStore',
        'devilry.statistics.AggregatedPeriodDataForStudentBase',
        'devilry.statistics.LabelManager'
    ],

    constructor: function(periodid, config) {
        this._completeDatasetStatus = {loaded: false}; // NOTE: When this is a boolean instead of an object, the attribute does not seem to update everywhere, which leads to multiple loads of complete dataset.
        this._students_by_releatedid = {};
        this.periodid = periodid;
        this.labelManager = Ext.create('devilry.statistics.LabelManager', {
            loader: this
            //listeners: {
                //scope: this,
                //changedMany: this._onDataChanged
            //}
        });

        this.assignment_store = Ext.create('Ext.data.Store', {
            model: 'devilry.apps.administrator.simplified.SimplifiedAssignment',
            remoteFilter: true,
            remoteSort: true
        });
        this.assignment_ids = [];

        this.addEvents('completeDatasetLoaded', 'minimalDatasetLoaded', 'filterApplied', 'filterCleared');
        // Copy configured listeners into *this* object so that the base class's
        // constructor will add them.
        this.listeners = config.listeners;

        this.callParent(arguments);
        this._loadMinimalDataset();
        //this.requireCompleteDataset(Ext.emptyFn);
    },


    _createModel: function() {
        var fields = [
            {name: 'userid', type: 'int'},
            {name: 'username', type: 'string'},
            {name: 'full_name', type: 'string'},
            {name: 'labels', type: 'auto'},
            {name: 'relatedstudent_id', type: 'int'},
            {name: 'totalScaledPoints', type: 'int'}
        ];
        Ext.each(this.assignment_store.data.items, function(assignmentRecord, index) {
            fields.push(assignmentRecord.get('short_name'));
            var scaledPointdataIndex = assignmentRecord.get('id') + '::scaledPoints';
            fields.push(scaledPointdataIndex);
        }, this);
        var model = Ext.define('devilry.statistics.AggregatedPeriodDataForStudentGenerated', {
            extend: 'devilry.statistics.AggregatedPeriodDataForStudentBase',
            idProperty: 'userid',
            fields: fields
        });
    },

    _createStore: function() {
        this._createModel();
        this.store = Ext.create('Ext.data.Store', {
            model: 'devilry.statistics.AggregatedPeriodDataForStudentGenerated',
            autoSync: false,
            proxy: 'memory'
        });
    },

    updateScaledPoints: function() {
        Ext.each(this.store.data.items, function(studentRecord, index) {
            studentRecord.updateScaledPoints();
        }, this);
    },

    filterBy: function(description, fn, scope) {
        this.store.filterBy(fn, scope);
        this.fireEvent('filterApplied', this, description);
    },

    clearFilter: function() {
        this.store.clearFilter();
        this.fireEvent('filterCleared', this);
    },

    _handleLoadError: function(details, op) {
        this._unmask();
        var httperror = 'Lost connection with server';
        if(op.error.status !== 0) {
            httperror = Ext.String.format('{0} {1}', op.error.status, op.error.statusText);
        }
        Ext.MessageBox.show({
            title: 'Failed to load the period overview',
            msg: '<p>This is usually caused by an unstable server connection. <strong>Try reloading the page</strong>.</p>' +
                Ext.String.format('<p>Error details: {0}: {1}</p>', httperror, details),
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.ERROR,
            closable: false
        });
    },

    findAssignmentByShortName: function(short_name) {
        return this.assignment_store.findRecord('short_name', short_name);
    },





    ////////////////////////////////////////////////
    //
    // Minimal dataset loaders
    //
    ////////////////////////////////////////////////

    _loadMinimalDataset: function() {
        this._mask('Loading all data about all students on the period', 'page-load-mask');
        this._loadPeriod();
    },

    /**
     * @private
     */
    _loadPeriod: function() {
        Ext.ModelManager.getModel('devilry.apps.administrator.simplified.SimplifiedPeriod').load(this.periodid, {
            scope: this,
            callback: function(record, op) {
                if(!op.success) {
                    this._handleLoadError('Failed to load period', op);
                    return;
                }
                this.periodRecord = record;
                this._loadAssignments();
            }
        });
    },

    /**
     * @private
     */
    _loadAllStudentLabels: function() {
        this.relatedstudentkeyvalue_store = Ext.create('Ext.data.Store', {
            model: 'devilry.apps.administrator.simplified.SimplifiedRelatedStudentKeyValue',
            remoteFilter: true,
            remoteSort: true
        });
        this.relatedstudentkeyvalue_store.pageSize = 100000; // TODO: avoid UGLY hack
        this.relatedstudentkeyvalue_store.proxy.setDevilryFilters([{
            field: 'relatedstudent__period',
            comp: 'exact',
            value: this.periodid
        }, {
            field: 'application',
            comp: 'exact',
            value: this.labelManager.application_id
        }]);
        this.relatedstudentkeyvalue_store.load({
            scope: this,
            callback: this._onLoadAllStudentLabels
        });
    },

    /**
     * @private
     */
    _onLoadAllStudentLabels: function(records, op) {
        if(!op.success) {
            this._handleLoadError('Failed to load labels', op);
            return;
        }
        this._loadAllRelatedStudents();
    },

    /**
     * @private
     */
    _loadAllRelatedStudents: function() {
        this.relatedstudent_store = Ext.create('Ext.data.Store', {
            model: 'devilry.apps.administrator.simplified.SimplifiedRelatedStudent',
            remoteFilter: true,
            remoteSort: true
        });
        this.relatedstudent_store.pageSize = 100000; // TODO: avoid UGLY hack
        this.relatedstudent_store.proxy.setDevilryFilters([{
            field: 'period',
            comp: 'exact',
            value: this.periodid
        }]);
        this.relatedstudent_store.load({
            scope: this,
            callback: this._onLoadAllRelatedStudents
        });
    },

    /**
     * @private
     */
    _onLoadAllRelatedStudents: function(records, op) {
        if(!op.success) {
            this._handleLoadError('Failed to load related students', op);
            return;
        }
        this._loadAssignments();
    },

    /**
     * @private
     */
    _loadAssignments: function() {
        this.assignment_store.pageSize = 100000; // TODO: avoid UGLY hack
        this.assignment_store.proxy.setDevilryFilters([{
            field: 'parentnode',
            comp: 'exact',
            value: this.periodid
        }]);
        this.assignment_store.proxy.setDevilryOrderby(['publishing_time']);
        this.assignment_store.load({
            scope: this,
            callback: this._onAssignmentsLoaded
        });
    },

    /**
     * @private
     */
    _onAssignmentsLoaded: function(assignmentrecords, op) {
        if(!op.success) {
            this._handleLoadError('Failed to load assignments', op);
            return;
        }
        this._tmpAssignmentsWithAllGroupsLoaded = 0;
        Ext.each(assignmentrecords, function(assignmentrecord, index) {
            this.assignment_ids.push(assignmentrecord.get('id'));
        }, this);
        this._loadAggregatedPeriodData(false, this._onMinimalDatasetLoaded);
    },













    _loadAggregatedPeriodData: function(loadEverything, callbackFn) {
        this.aggregatedPeriodDataStore = Ext.create('devilry.statistics.AggregatedPeriodDataStore');
        this.aggregatedPeriodDataStore.loadForPeriod(this.periodid, {
            scope: this,
            callback: function(records, operation) {
                if(operation.success) {
                    Ext.callback(callbackFn, this);
                } else {
                    Ext.MessageBox.show({
                        title: 'Failed to load the period overview',
                        msg: '<p>Try reloading the page.</p>',
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.ERROR,
                        closable: false
                    });
                }
            }
        });
    },











    ////////////////////////////////////////////////
    //
    // AFTER Minimal dataset loaded
    //
    ////////////////////////////////////////////////

    _onMinimalDatasetLoaded: function() {
        this._mask('Rendering table of all results. May take some time for many students.', 'page-load-mask');
        this._minimalDatasetLoaded = true;
        this._createStore();
        this.store.suspendEvents();
        this._mergeMinimalDatasetIntoStore();
        this.store.resumeEvents();
        this._unmask();

        this.fireEvent('minimalDatasetLoaded', this);
    },

    _mergeMinimalDatasetIntoStore: function() {
        this._addAllRelatedStudentsToStore();
        //this._addLabelsToStore();
    },

    _addAllRelatedStudentsToStore: function() {
        this.totalStudents = this.aggregatedPeriodDataStore.data.items.length;
        this.aggregatedPeriodDataStore.each(function(aggregatedPeriodDataItem) {
            var userid = aggregatedPeriodDataItem.get('userid')
            var user = aggregatedPeriodDataItem.get('user');
            var relatedStudent = aggregatedPeriodDataItem.get('relatedstudent');
            var record = Ext.create('devilry.statistics.AggregatedPeriodDataForStudentGenerated', {
                userid: userid,
                username: user.username,
                full_name: user.full_name,
                relatedstudent_id: relatedStudent.id,
                labels: relatedStudent.labels
            });
            this.store.add(record);
            record.assignment_store = this.assignment_store;
            //record.relatedStudentRecord = relatedStudentRecord;
            record.groupsByAssignmentId = {};
            this._students_by_releatedid[relatedStudent.id] = record;
        }, this);
    },
    //_addAllRelatedStudentsToStoreOld: function() {
        //this.totalStudents = this.relatedstudent_store.data.items.length;
        //Ext.each(this.relatedstudent_store.data.items, function(relatedStudentRecord, index) {
            //var userid = relatedStudentRecord.get('user')
            //var username = relatedStudentRecord.get('user__username')
            //var record = Ext.create('devilry.statistics.AggregatedPeriodDataForStudentGenerated', {
                //userid: userid,
                //username: username,
                //full_name: relatedStudentRecord.get('user__devilryuserprofile__full_name'),
                //labelKeys: []
            //});
            //this.store.add(record);
            //record.labels = [];
            //record.assignment_store = this.assignment_store;
            //record.relatedStudentRecord = relatedStudentRecord;
            //record.groupsByAssignmentId = {};
            //this._students_by_releatedid[relatedStudentRecord.get('id')] = record;
        //}, this);
    //},

    //_addLabelsToStore: function() {
        //Ext.each(this.relatedstudentkeyvalue_store.data.items, function(appKeyValueRecord, index) {
            //var relatedstudent_id = appKeyValueRecord.get('relatedstudent');
            //var label = appKeyValueRecord.get('key');
            //var labelDescription = appKeyValueRecord.get('value');
            //var studentRecord = this._students_by_releatedid[relatedstudent_id];
            //studentRecord.labels[label] = appKeyValueRecord;
            //studentRecord.setLabelKeysFromLabels();
        //}, this);
    //},







    ////////////////////////////////////////////////////
    //
    // Complete dataset loaders
    //
    ////////////////////////////////////////////////////

    requireCompleteDataset: function(callback, scope, args) {
        if(this._completeDatasetStatus.loaded) {
            Ext.bind(callback, scope, args)();
        } else {
            this.addListener('completeDatasetLoaded', function() {
                Ext.bind(callback, scope, args)();
            }, this, {single: true});
            this._mask('Loading all results for all students', 'page-load-mask');
            //this._loadAllGroupsInPeriod();
            this._loadAggregatedPeriodData(true, this._onCompleteDatasetLoaded);
        }
    },

    /**
     * @private
     */
    //_loadAllGroupsInPeriod: function() {
        //this.assignmentgroup_store = Ext.create('Ext.data.Store', {
            //model: 'devilry.apps.administrator.simplified.SimplifiedAssignmentGroup',
            //remoteFilter: true,
            //remoteSort: true
        //});
        //this.assignmentgroup_store.pageSize = 100000; // TODO: avoid UGLY hack
        //this.assignmentgroup_store.proxy.setDevilryFilters([{
            //field: 'parentnode__parentnode',
            //comp: 'exact',
            //value: this.periodid
        //}]);
        //this.assignmentgroup_store.load({
            //scope: this,
            //callback: this._onLoadAllGroupsInPeriod
        //});
    //},

    /**
     * @private
     */
    //_onLoadAllGroupsInPeriod: function(grouprecords, op) {
        //if(!op.success) {
            //this._handleLoadError('Failed to load assignment groups', op);
            //return;
        //}
        //this._loadAllCandidatesInPeriod();
    //},

    /** 
     * @private
     */
    //_loadAllCandidatesInPeriod: function() {
        //this.candidate_store = Ext.create('Ext.data.Store', {
            //model: 'devilry.apps.administrator.simplified.SimplifiedCandidate',
            //remoteFilter: true,
            //remoteSort: true
        //});
        //this.candidate_store.pageSize = 100000; // TODO: avoid UGLY hack
        //this.candidate_store.proxy.setDevilryFilters([{
            //field: 'assignment_group__parentnode__parentnode',
            //comp: 'exact',
            //value: this.periodid
        //}]);
        //this.candidate_store.load({
            //scope: this,
            //callback: this._onLoadAllCandidatesInPeriod
        //});
    //},

    /**
     * @private
     */
    //_onLoadAllCandidatesInPeriod: function(records, op) {
        //if(!op.success) {
            //this._handleLoadError('Failed to load candidates', op);
            //return;
        //}
        //this._onCompleteDatasetLoaded();
    //},

    

    //////////////////////////////////////////////
    //
    // AFTER complete dataset loaded
    //
    //////////////////////////////////////////////

    _onCompleteDatasetLoaded: function() {
        this._unmask();
        if(this._minimalDatasetLoaded) {
            this._mergeCompleteDatasetIntoStore();
        } else {
            this.addListener('minimalDatasetLoaded', this._mergeCompleteDatasetIntoStore, this, {single: true});
        }
    },

    _mergeCompleteDatasetIntoStore: function() {
        if(this._completeDatasetStatus.loaded) {
            return;
        }
        this._completeDatasetStatus.loaded = true;
        this._mask('Calculating table of all results. May take some time for many students.', 'page-load-mask');

        this.store.suspendEvents();
        this._addAssignmentsToStore(function() {
            this._addGroupsToStore(function() {
                this.updateScaledPoints();
                this.store.resumeEvents();

                this.fireEvent('completeDatasetLoaded', this);
                this._unmask();
            });
        });
    },

    _addAssignmentsToStore: function(onComplete) {
        var assignment_ids = [];
        Ext.each(this.assignment_store.data.items, function(assignmentRecord, index) {
            assignment_ids.push(assignmentRecord.get('id'));
        }, this);
        this._iterateWithDeferYields(this.store.data.items, function(studentRecord, index) {
            Ext.each(this.assignment_store.data.items, function(assignmentRecord, index) {
                studentRecord.groupsByAssignmentId[assignmentRecord.get('id')] = {
                    groupInfo: null,
                    scaled_points: null
                };
            }, this);
            studentRecord.assignment_ids = assignment_ids;
        }, this, onComplete);
    },

    _addGroupsToStore: function(onComplete) {
        this._iterateWithDeferYields(this.aggregatedPeriodDataStore.data.items, function(aggregatedPeriodDataItem) {
            userid = aggregatedPeriodDataItem.get('userid');
            var studentRecord = this.store.getById(userid);
            var groups = aggregatedPeriodDataItem.get('groups');
            for(var index=0; index<groups.length; index++)  {
                var groupInfo = groups[index];
                var group = studentRecord.groupsByAssignmentId[groupInfo.assignment_id];
                group.groupInfo = groupInfo;
            }
        }, this, onComplete);
    },
    //_addGroupsToStoreOld: function(onComplete) {
        //this._iterateWithDeferYields(this.candidate_store.data.items, function(candidateRecord, index) {
            //var student_id = candidateRecord.get('student');
            //var studentRecord = this.store.getById(student_id);
            //if(studentRecord) {
                //var assignmentgroup_id = candidateRecord.get('assignment_group');
                //var assignmentGroupRecord = this.assignmentgroup_store.getById(assignmentgroup_id);

                //var assignment_id = assignmentGroupRecord.get('parentnode');
                //var group = studentRecord.groupsByAssignmentId[assignment_id];
                //group.candidates.push(candidateRecord); // This will add only unique candidate records, since we only fetch distinct candidates
                //group.assignmentGroupRecord = assignmentGroupRecord; // This will be overwritten for each candidate, but that does not matter, since they overwrite with the same record
            //}
        //}, this, onComplete);
    //},

    /**
     * @private
     * Almost drop-in replacement for Ext.Array.each that uses Ext.defer on
     * every 200 item to yield control back to the browser, which prevents
     * "stop script" popups.
     *
     * The primary difference from Ext.Array.each is that this function is
     * asynchronous. Therefore it takes the onComplete parameter which is a
     * callback function that is invoked when the iteration is complete.
     */
    _iterateWithDeferYields: function(items, callback, scope, onComplete, start) {
        if(start === undefined) {
            start = 0;
        }
        var index;
        for(index=start; index<items.length; index++) {
            Ext.bind(callback, scope)(items[index], index);
            if(index > 0 && index % 200 === 0) {
                Ext.defer(function() {
                    this._iterateWithDeferYields(items, callback, scope, onComplete, index+1);
                }, 5, this);
                break;
            }
        }
        if(index === items.length) {
            Ext.bind(onComplete, scope)();
        }
    },

    _mask: function(msg) {
        this.fireEvent('mask', this, msg);
    },

    _unmask: function() {
        this.fireEvent('unmask', this);
    }
});
