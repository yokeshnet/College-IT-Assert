import React, { useState, useMemo } from 'react';
import { TimetableEntry, Subject, Faculty, TimeSlot } from '../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Users, 
  Copy, 
  Search, 
  Filter, 
  X, 
  Check, 
  GraduationCap,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface TimetableModuleProps {
  timetables: TimetableEntry[];
  subjects: Subject[];
  faculty: Faculty[];
  timeSlots: TimeSlot[];
  onAddTimetable: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
  onUpdateTimetable: (entry: TimetableEntry) => Promise<void>;
  onDeleteTimetable: (id: string) => Promise<void>;
  onDuplicateSemester: () => Promise<void>;
  onAddSubject: (subj: Subject) => Promise<void>;
  onAddFaculty: (fac: Faculty) => Promise<void>;
  simulatedDay: string;
  simulatedPeriod: number;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIOD_LIST = [1, 2, 3, 4, 5, 6];

export const TimetableModule: React.FC<TimetableModuleProps> = ({
  timetables,
  subjects,
  faculty,
  timeSlots,
  onAddTimetable,
  onUpdateTimetable,
  onDeleteTimetable,
  onDuplicateSemester,
  onAddSubject,
  onAddFaculty,
  simulatedDay,
  simulatedPeriod
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(simulatedDay || 'MONDAY');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'subjects' | 'faculty'>('schedule');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

  // Form states for Timetable Entry
  const [formDay, setFormDay] = useState<string>('MONDAY');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formYear, setFormYear] = useState<string>('II');
  const [formDepartment, setFormDepartment] = useState<string>('CSE');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formSubjectCode, setFormSubjectCode] = useState<string>('');
  const [formLaboratory, setFormLaboratory] = useState<string>('Computer Society and Security Lab');
  const [formBatch, setFormBatch] = useState<string>('');
  const [formFaculty, setFormFaculty] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>("ST.PAUL'S BLOCK-GROUND FLOOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for Subject
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDept, setNewSubDept] = useState('CSE');
  const [newSubYear, setNewSubYear] = useState('II');

  // Form state for Faculty
  const [newFacId, setNewFacId] = useState('');
  const [newFacName, setNewFacName] = useState('');
  const [newFacDesig, setNewFacDesig] = useState('Associate Professor');
  const [newFacDept, setNewFacDept] = useState('CSE');

  // Helper mapping for period times
  const periodTimeMap = useMemo(() => {
    const map: Record<number, { startTime: string; endTime: string }> = {
      1: { startTime: '09:00 AM', endTime: '10:00 AM' },
      2: { startTime: '10:00 AM', endTime: '11:00 AM' },
      3: { startTime: '11:15 AM', endTime: '12:15 PM' },
      4: { startTime: '12:15 PM', endTime: '01:15 PM' },
      5: { startTime: '01:15 PM', endTime: '02:15 PM' },
      6: { startTime: '02:15 PM', endTime: '03:15 PM' }
    };
    timeSlots.forEach(s => {
      map[s.period] = { startTime: s.startTime, endTime: s.endTime };
    });
    return map;
  }, [timeSlots]);

  // Filtered timetable entries
  const filteredEntries = useMemo(() => {
    return timetables.filter(t => {
      const matchDay = t.day === selectedDay;
      const matchYear = yearFilter === 'ALL' || t.year === yearFilter;
      const matchSearch = !searchQuery || 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.faculty.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDay && matchYear && matchSearch;
    });
  }, [timetables, selectedDay, yearFilter, searchQuery]);

  // Open modal for creating new entry
  const handleOpenAddEntry = (day?: string, period?: number) => {
    setEditingEntry(null);
    setFormDay(day || selectedDay);
    setFormPeriod(period || 1);
    setFormYear('II');
    setFormDepartment('CSE');
    setFormSubject(subjects[0]?.subjectName || '');
    setFormSubjectCode(subjects[0]?.subjectCode || '');
    setFormLaboratory('Computer Society and Security Lab');
    setFormBatch('');
    setFormFaculty(faculty[0]?.name || '');
    setFormRoom("ST.PAUL'S BLOCK-GROUND FLOOR");
    setIsEntryModalOpen(true);
  };

  // Open modal for editing existing entry
  const handleOpenEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormDay(entry.day);
    setFormPeriod(entry.period);
    setFormYear(entry.year);
    setFormDepartment(entry.department);
    setFormSubject(entry.subject);
    setFormSubjectCode(entry.subjectCode);
    setFormLaboratory(entry.laboratory);
    setFormBatch(entry.batch);
    setFormFaculty(entry.faculty);
    setFormRoom(entry.room);
    setIsEntryModalOpen(true);
  };

  // Submit timetable entry form
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const times = periodTimeMap[formPeriod] || { startTime: '09:00 AM', endTime: '10:00 AM' };

    try {
      if (editingEntry) {
        await onUpdateTimetable({
          ...editingEntry,
          day: formDay,
          period: formPeriod,
          startTime: times.startTime,
          endTime: times.endTime,
          year: formYear,
          department: formDepartment,
          subject: formSubject,
          subjectCode: formSubjectCode,
          laboratory: formLaboratory,
          batch: formBatch.toUpperCase(),
          faculty: formFaculty,
          room: formRoom
        });
      } else {
        await onAddTimetable({
          day: formDay,
          period: formPeriod,
          startTime: times.startTime,
          endTime: times.endTime,
          year: formYear,
          department: formDepartment,
          subject: formSubject,
          subjectCode: formSubjectCode,
          laboratory: formLaboratory,
          batch: formBatch.toUpperCase(),
          faculty: formFaculty,
          room: formRoom
        });
      }
      setIsEntryModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle subject change to auto-sync subjectCode
  const handleSubjectChange = (name: string) => {
    setFormSubject(name);
    const found = subjects.find(s => s.subjectName === name);
    if (found) {
      setFormSubjectCode(found.subjectCode);
      setFormYear(found.year);
    }
  };

  // Handle subject save
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddSubject({
        subjectCode: newSubCode.trim().toUpperCase(),
        subjectName: newSubName.trim(),
        department: newSubDept,
        year: newSubYear
      });
      setNewSubCode('');
      setNewSubName('');
      setIsSubjectModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle faculty save
  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacId.trim() || !newFacName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddFaculty({
        facultyId: newFacId.trim().toUpperCase(),
        name: newFacName.trim(),
        designation: newFacDesig,
        department: newFacDept
      });
      setNewFacId('');
      setNewFacName('');
      setIsFacultyModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Laboratory Timetable Matrix</span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Computer Society & Security Lab • Department of Computer Science & Engineering
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAddEntry()}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Slot</span>
          </button>

          <button
            onClick={() => onDuplicateSemester()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-slate-700 active:scale-95"
            title="Duplicate current timetable schedule"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-slate-700 active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subjects</span>
          </button>

          <button
            onClick={() => setIsFacultyModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-slate-700 active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Faculty</span>
          </button>
        </div>
      </div>

      {/* Tabs: Schedule | Subjects Directory | Faculty Directory */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'schedule'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Weekly Schedule</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'subjects'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Subjects ({subjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'faculty'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Faculty Directory ({faculty.length})</span>
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Day Selector Pills & Filter Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Days Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
              {DAYS.map(day => {
                const isSelected = selectedDay === day;
                const isToday = simulatedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{day.substring(0, 3)}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-3">
              {/* Year Filter */}
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-slate-300 uppercase tracking-widest outline-none border-0 cursor-pointer"
                >
                  <option value="ALL">All Years</option>
                  <option value="I">Year I</option>
                  <option value="II">Year II</option>
                  <option value="III">Year III</option>
                  <option value="IV">Year IV</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="SEARCH CLASS, BATCH..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-[10px] font-black text-white placeholder:text-slate-600 uppercase tracking-wider outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          </div>

          {/* Schedule Table / Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white uppercase tracking-wider">{selectedDay} Schedule</span>
                {simulatedDay === selectedDay && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                    ACTIVE DAY
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[10px] font-bold">
                {filteredEntries.length} Classes Scheduled
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {PERIOD_LIST.map(periodNum => {
                const slotTimes = periodTimeMap[periodNum] || { startTime: '09:00 AM', endTime: '10:00 AM' };
                const periodEntries = filteredEntries.filter(t => t.period === periodNum);
                const isCurrentPeriod = selectedDay === simulatedDay && simulatedPeriod === periodNum;

                return (
                  <div 
                    key={periodNum}
                    className={`p-4 sm:p-6 transition-all ${
                      isCurrentPeriod ? 'bg-violet-950/20 border-l-4 border-l-violet-500' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Period Header Column */}
                      <div className="w-full md:w-48 flex-shrink-0 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${isCurrentPeriod ? 'text-violet-400' : 'text-slate-300'}`}>
                            Period {periodNum}
                          </span>
                          {isCurrentPeriod && (
                            <span className="px-1.5 py-0.5 rounded bg-violet-600 text-white text-[7px] font-black uppercase tracking-widest">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{slotTimes.startTime} - {slotTimes.endTime}</span>
                        </div>
                        <button
                          onClick={() => handleOpenAddEntry(selectedDay, periodNum)}
                          className="mt-2 hidden md:flex items-center gap-1 text-[8px] font-black text-slate-500 hover:text-violet-400 uppercase tracking-widest transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      </div>

                      {/* Entries List for this Period */}
                      <div className="flex-1">
                        {periodEntries.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {periodEntries.map(entry => (
                              <div
                                key={entry.id}
                                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 hover:border-violet-500/40 transition-all group relative"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-400 text-[9px] font-black font-mono">
                                        {entry.subjectCode}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400 text-[9px] font-black uppercase">
                                        Batch: {entry.batch}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[8px] font-bold">
                                        Year {entry.year}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-violet-300 transition-colors">
                                      {entry.subject}
                                    </h4>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleOpenEditEntry(entry)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                      title="Edit Class"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteTimetable(entry.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                      title="Delete Class"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                    <span className="truncate max-w-[240px]" title={entry.faculty}>
                                      {entry.faculty}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500 text-[9px]">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[160px]">{entry.laboratory}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-850 border-dashed">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                              Free Lab Slot • No Class Scheduled
                            </span>
                            <button
                              onClick={() => handleOpenAddEntry(selectedDay, periodNum)}
                              className="text-[9px] font-black text-violet-400 hover:text-violet-300 uppercase tracking-widest flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Schedule</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subjects Directory Tab */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Course Curriculum & Subjects</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configured laboratory curriculum course codes</p>
            </div>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(s => (
              <div key={s.subjectCode} className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-violet-600/15 border border-violet-500/25 text-violet-400 text-[10px] font-mono font-black">
                      {s.subjectCode}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      Year {s.year} • {s.department}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{s.subjectName}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty Directory Tab */}
      {activeTab === 'faculty' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Faculty & Instructors Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Faculty members assigned to laboratory practical sessions</p>
            </div>
            <button
              onClick={() => setIsFacultyModalOpen(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.map(f => (
              <div key={f.facultyId} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 text-xs font-black">
                  {f.facultyId}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{f.name}</h4>
                  <p className="text-[9px] text-slate-500">{f.designation} • {f.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Timetable Entry */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white tracking-tight">
                {editingEntry ? 'Edit Class Timetable Slot' : 'Add New Class Slot'}
              </h3>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Day</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Period</label>
                  <select
                    value={formPeriod}
                    onChange={e => setFormPeriod(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  >
                    {PERIOD_LIST.map(p => (
                      <option key={p} value={p}>
                        Period {p} ({periodTimeMap[p]?.startTime} - {periodTimeMap[p]?.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Batch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C4, A1, B2"
                    value={formBatch}
                    onChange={e => setFormBatch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white uppercase outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Year</label>
                  <select
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dept</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Programming in Java"
                    value={formSubject}
                    onChange={e => handleSubjectChange(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                  {subjects.length > 0 && (
                    <select
                      onChange={e => handleSubjectChange(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-2 text-[10px] text-slate-400 outline-none"
                    >
                      <option value="">Choose preset...</option>
                      {subjects.map(s => (
                        <option key={s.subjectCode} value={s.subjectName}>{s.subjectName}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S12BLH31"
                    value={formSubjectCode}
                    onChange={e => setFormSubjectCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono uppercase outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Room / Floor</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faculty / Staff</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. M. D. Anto Praveena / Dr. B. Ankayarkanni"
                  value={formFaculty}
                  onChange={e => setFormFaculty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Laboratory Location</label>
                <input
                  type="text"
                  value={formLaboratory}
                  onChange={e => setFormLaboratory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Add Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Subject */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Add Curriculum Subject</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-4 mt-6">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S12BLH31"
                  value={newSubCode}
                  onChange={e => setNewSubCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white uppercase font-mono outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Programming in Java"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Year</label>
                  <select
                    value={newSubYear}
                    onChange={e => setNewSubYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="I">Year I</option>
                    <option value="II">Year II</option>
                    <option value="III">Year III</option>
                    <option value="IV">Year IV</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</label>
                  <input
                    type="text"
                    value={newSubDept}
                    onChange={e => setNewSubDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl text-xs uppercase">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Faculty */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Add Faculty Member</h3>
              <button onClick={() => setIsFacultyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveFaculty} className="space-y-4 mt-6">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faculty ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. F47"
                  value={newFacId}
                  onChange={e => setNewFacId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white uppercase font-mono outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alex Johnson"
                  value={newFacName}
                  onChange={e => setNewFacName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Designation</label>
                  <select
                    value={newFacDesig}
                    onChange={e => setNewFacDesig(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lab Assistant">Lab Assistant</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</label>
                  <input
                    type="text"
                    value={newFacDept}
                    onChange={e => setNewFacDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFacultyModalOpen(false)} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl text-xs uppercase">Save Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
