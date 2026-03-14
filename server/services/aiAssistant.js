/**
 * AI Assistant - MyIEC ERP
 * Context-aware, role-aware, English + Hinglish
 * Uses OpenAI when API key present; fallback to rule-based responses
 */
const config = require('../config/env');
const { Attendance, Fee, Result, Timetable, Notice, User } = require('../models');
const mongoose = require('mongoose');

const ROLE_PROMPTS = {
  admin: 'You are an AI assistant for IEC College ERP Admin. You can answer about users, attendance, fees, exams, timetables, notices, library, and analytics. Be concise and actionable.',
  student: 'You are an AI assistant for IEC College students. You help with attendance percentage, marks/CGPA, fee status, timetable, exam dates, notices, and library. Answer in friendly tone. Support Hinglish (Hindi+English) if user asks in Hinglish.',
  faculty: 'You are an AI assistant for IEC College faculty. You help with marking attendance, viewing defaulters, exam schedule, timetable, and teaching-related queries. Be professional.',
};

async function getContextForUser(userId, role) {
  const fields = 'name rollNo branch semester department';
  const user = await User.findById(userId).select(role === 'faculty' ? fields + ' subjects' : fields);
  const context = { user: user?.toObject(), role };
  if (role === 'student' && user) {
    const [attStats, feePending, results] = await Promise.all([
      Attendance.aggregate([
        { $match: { student: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Fee.find({ student: user._id, status: { $in: ['pending', 'overdue'] } }).select('amount dueDate type').limit(5),
      Result.find({ student: user._id }).sort({ examSession: -1 }).limit(1).populate('subject', 'code name'),
    ]);
    const totalAtt = attStats.reduce((s, x) => s + x.count, 0);
    const present = attStats.find((x) => x._id === 'present')?.count || 0;
    context.attendancePercent = totalAtt ? ((present / totalAtt) * 100).toFixed(1) : null;
    context.pendingFees = feePending.map((f) => ({ type: f.type, amount: f.amount, dueDate: f.dueDate }));
    context.latestResult = results[0] ? { session: results[0].examSession, marks: results[0].marksObtained } : null;
  }
  if (role === 'faculty' || role === 'admin') {
    const subjectFilter = role === 'faculty' && user?.subjects?.length
      ? { subject: { $in: user.subjects.map((s) => (s._id || s)) } }
      : {};
    const [defaultersCount, feeRisk] = await Promise.all([
      Attendance.aggregate([
        { $match: { status: 'present', ...subjectFilter } },
        { $group: { _id: '$student', present: { $sum: 1 } } },
      ]).then((presentCount) => {
        return Attendance.aggregate([
          { $match: subjectFilter },
          { $group: { _id: '$student', total: { $sum: 1 } } },
        ]).then((totalCount) => {
          const totalMap = Object.fromEntries(totalCount.map((t) => [t._id.toString(), t.total]));
          return presentCount.filter((p) => {
            const total = totalMap[p._id.toString()] || 0;
            return total > 0 && (p.present / total) * 100 < 75;
          }).length;
        });
      }),
      role === 'admin' ? Fee.countDocuments({ status: { $in: ['pending', 'overdue'] }, dueDate: { $lt: new Date() } }) : Promise.resolve(null),
    ]);
    context.defaultersCount = defaultersCount;
    context.overdueFeesCount = feeRisk;
  }
  return context;
}

function buildSystemPrompt(role, context) {
  const base = ROLE_PROMPTS[role] || ROLE_PROMPTS.student;
  let extra = '';
  if (context.user) {
    extra += `\nCurrent user: ${context.user.name}, role: ${role}.`;
    if (context.attendancePercent != null) extra += ` Attendance (approx): ${context.attendancePercent}%.`;
    if (context.pendingFees?.length) extra += ` Pending fees: ${context.pendingFees.length} item(s).`;
    if (context.defaultersCount != null) extra += ` Attendance defaulters (<75%): ${context.defaultersCount}.`;
    if (context.overdueFeesCount != null) extra += ` Overdue fee records: ${context.overdueFeesCount}.`;
  }
  return base + extra + '\nAnswer based on the context when relevant. If data is not available, say so and suggest checking the dashboard.';
}

async function ruleBasedResponse(query, role, context) {
  const q = query.toLowerCase().trim();
  const isHinglish = /(hai|ho|kaise|kya|kitna|kab|mera|mere|attendance|marks|fees|fee|timetable|exam)/i.test(q);

  if (/(attendance|present|absent|defaulters?|kitna.*attendance)/i.test(q)) {
    if (role === 'student' && context.attendancePercent != null) {
      return { reply: `Your approximate attendance is ${context.attendancePercent}%. Check the Attendance section for subject-wise details.`, source: 'context' };
    }
    if (['admin', 'faculty'].includes(role) && context.defaultersCount != null) {
      return { reply: `There are about ${context.defaultersCount} students with attendance below 75%. Use the Attendance > Defaulters report for the list.`, source: 'context' };
    }
    return { reply: 'Attendance data is available in the Attendance module. Students can see their percentage; faculty can mark and view defaulters.', source: 'rule' };
  }

  if (/(fee|fees|payment|dues?|pending|overdue)/i.test(q)) {
    if (role === 'student' && context.pendingFees?.length) {
      const summary = context.pendingFees.map((f) => `${f.type}: ₹${f.amount} (due ${f.dueDate?.toISOString?.()?.slice(0, 10)})`).join('; ');
      return { reply: `You have pending/overdue fees: ${summary}. Pay from Fee Management to avoid late charges.`, source: 'context' };
    }
    if (role === 'admin' && context.overdueFeesCount != null) {
      return { reply: `There are ${context.overdueFeesCount} overdue fee record(s). Check Fee Management > Risk for details.`, source: 'context' };
    }
    return { reply: 'Fee details are in Fee Management. You can view pending dues and pay online.', source: 'rule' };
  }

  if (/(marks?|result|cgpa|sgpa|grade|exam.*result)/i.test(q)) {
    if (role === 'student' && context.latestResult) {
      return { reply: `Your latest result (${context.latestResult.session}) shows marks: ${context.latestResult.marks}. Open Exam/Results for full CGPA/SGPA.`, source: 'context' };
    }
    return { reply: 'Results and CGPA/SGPA are available under Examinations > Results. Use the filters for session and subject.', source: 'rule' };
  }

  if (/(timetable|schedule|class|period|kab.*class)/i.test(q)) {
    return { reply: 'Your timetable is under Timetable. Select your branch and semester to view the weekly schedule.', source: 'rule' };
  }

  if (/(notice|notification|circular|announcement)/i.test(q)) {
    return { reply: 'Notices and announcements are in the Notices section. You can also see summarized notices on the dashboard.', source: 'rule' };
  }

  if (/(library|book|issue|return)/i.test(q)) {
    return { reply: 'Library books and your issued items are in Library. You can get recommendations based on your branch and history.', source: 'rule' };
  }

  if (/(risk|recovery|fee.*risk|recovery.*risk)/i.test(q) && role === 'admin') {
    if (context.overdueFeesCount != null) {
      return { reply: `Fee recovery risk: ${context.overdueFeesCount} overdue record(s) hai. Students at risk list ke liye Fee Management > Risk dekho. Recovery improve karne ke liye reminders bhejo aur due dates track karo.`, source: 'context' };
    }
    return { reply: 'Fee recovery risk dekhne ke liye Admin dashboard ya Fee Risk page use karo. Overdue count aur students at risk wahan show hote hain.', source: 'rule' };
  }

  if (/(fail|weak|kamzor|backlog)/i.test(q)) {
    if (['admin', 'faculty'].includes(role) && context.defaultersCount != null) {
      return { reply: `Attendance ke hisaab se lagbhag ${context.defaultersCount} students fail/defaulters ho sakte hain (75% se kam attendance). Defaulters list Attendance > Defaulters se dekho.`, source: 'context' };
    }
    if (role === 'student') {
      return { reply: 'Marks/result ke liye Exam > Results dekho. Weak subject detect karne ke liye subject-wise marks compare karo; CGPA/SGPA bhi wahan calculated hai.', source: 'rule' };
    }
    return { reply: 'Fail/weak students dekhne ke liye Faculty/Admin defaulters report ya result analysis use karo.', source: 'rule' };
  }

  if (/(hello|hi|hey|help|kaise ho)/i.test(q)) {
    return { reply: isHinglish ? 'Namaste! Main MyIEC ERP ka AI assistant hoon. Aap attendance, marks, fees, timetable, exam ya notices ke baare mein pooch sakte ho.' : 'Hello! I\'m the MyIEC ERP AI assistant. Ask me about attendance, marks, fees, timetable, exams, or notices.', source: 'rule' };
  }

  return null;
}

async function openAIResponse(systemPrompt, userMessage) {
  if (!config.OPENAI_API_KEY) return null;
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.4,
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    return reply ? { reply, source: 'openai' } : null;
  } catch (err) {
    console.error('OpenAI AI Assistant error:', err.message);
    return null;
  }
}

async function chat(userId, role, message) {
  const context = await getContextForUser(userId, role);
  const systemPrompt = buildSystemPrompt(role, context);
  const ruleReply = await ruleBasedResponse(message, role, context);
  if (ruleReply) return ruleReply;
  const openaiReply = await openAIResponse(systemPrompt, message);
  if (openaiReply) return openaiReply;
  return {
    reply: 'I couldn\'t find a specific answer. Please check your dashboard for attendance, fees, results, and timetable. You can ask in English or Hinglish: "mera attendance kitna hai?", "pending fees?", "exam kab hai?"',
    source: 'fallback',
  };
}

module.exports = { chat, getContextForUser, buildSystemPrompt, ROLE_PROMPTS };
