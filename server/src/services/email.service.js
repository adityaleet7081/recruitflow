import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── Application Confirmation to Candidate ───────────────────────────────────
export const sendApplicationConfirmation = async ({ to, candidateName, jobTitle, companyName }) => {
    await transporter.sendMail({
        from: `"RecruitFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Application Received — ${jobTitle} at ${companyName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Application Received ✓</h2>
        <p>Hi ${candidateName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        <p>We have received your application and will review it shortly. 
           If your profile matches our requirements, we will reach out to you.</p>
        <p style="color: #666; font-size: 14px;">— The ${companyName} Hiring Team</p>
      </div>
    `,
    });
};

// ─── AI Score Notification to Recruiter ──────────────────────────────────────
export const sendRecruiterScoreAlert = async ({ to, candidateName, jobTitle, score, summary }) => {
    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

    await transporter.sendMail({
        from: `"RecruitFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: `New Application: ${candidateName} scored ${score}/100 for ${jobTitle}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">New Candidate Alert</h2>
        <p>A new candidate has applied for <strong>${jobTitle}</strong>.</p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Candidate:</strong> ${candidateName}</p>
          <p><strong>AI Resume Score:</strong> 
            <span style="color: ${scoreColor}; font-size: 20px; font-weight: bold;">${score}/100</span>
          </p>
          <p><strong>Summary:</strong> ${summary}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Log in to RecruitFlow to view full analysis and manage this candidate.</p>
      </div>
    `,
    });
};

// ─── Assessment Invitation to Candidate (new) ────────────────────────────────
export const sendAssessmentEmail = async ({
    to,
    candidateName,
    jobTitle,
    testLink,
    timeLimitMinutes,
}) => {
    await transporter.sendMail({
        from: `"RecruitFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Skills Assessment Invitation — ${jobTitle}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">You've Been Invited to Take a Skills Assessment</h2>
        <p>Hi ${candidateName},</p>
        <p>As part of our hiring process for the <strong>${jobTitle}</strong> position, 
           we'd like you to complete a short technical assessment.</p>

        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p>📋 <strong>8 questions</strong> — mix of multiple choice and short answer</p>
          <p>⏱️ <strong>Time limit: ${timeLimitMinutes} minutes</strong> — timer starts when you click Begin</p>
          <p>💡 <strong>Tips:</strong> Find a quiet spot, read each question carefully, 
             and answer in your own words for short answers</p>
        </div>

        <p>Click the button below when you're ready. 
           <strong>The timer will only start once you click "Begin Assessment"</strong> — 
           so you can read instructions first.</p>

        <a href="${testLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #f97316); 
                  color: white; padding: 14px 28px; border-radius: 8px; 
                  text-decoration: none; font-weight: bold; margin: 16px 0;">
          Take Assessment →
        </a>

        <p style="color: #999; font-size: 12px;">
          This link is unique to you and can only be used once. 
          Do not share it with anyone.
        </p>
        <p style="color: #666; font-size: 14px;">Good luck! — The Hiring Team</p>
      </div>
    `,
    });
};