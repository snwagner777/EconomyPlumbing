import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { db } from '@/server/db';
import { chatbotConversations, chatbotMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/server/email';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    
    // Fetch conversation with messages
    const [conversation] = await db
      .select()
      .from(chatbotConversations)
      .where(eq(chatbotConversations.id, id));
      
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    const messages = await db
      .select()
      .from(chatbotMessages)
      .where(eq(chatbotMessages.conversationId, id))
      .orderBy(chatbotMessages.createdAt);
    
    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
    
    if (!adminEmail) {
      console.error("[Chatbot] ADMIN_EMAIL or CONTACT_EMAIL not configured");
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }
    
    // Format conversation for email (full implementation in server/routes.ts line 9007-9200)
    const formatTime = (date: Date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    
    // Build conversation HTML  
    let conversationHtml = messages.map((msg) => {
      const time = formatTime(msg.createdAt);
      const roleStyle = msg.role === 'user' 
        ? 'background-color: #e0f2fe; border-left: 3px solid #0284c7;'
        : 'background-color: #f3f4f6; border-left: 3px solid #6b7280;';
      
      return `
        <div style="${roleStyle} padding: 15px; margin: 10px 0; border-radius: 5px;">
          <div style="margin-bottom: 5px;">
            <strong style="color: ${msg.role === 'user' ? '#0284c7' : '#374151'};">
              ${msg.role === 'user' ? '👤 Customer' : '🤖 Assistant'}
            </strong>
            <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${time}</span>
          </div>
          ${msg.imageUrl ? `<div style="margin: 10px 0;"><a href="${msg.imageUrl}" style="color: #0284c7;">📷 View Attached Image</a></div>` : ''}
          <div style="white-space: pre-wrap; color: #374151;">${msg.content}</div>
          ${msg.feedback ? `<div style="margin-top: 10px;"><span style="color: ${msg.feedback === 'positive' ? '#10b981' : '#ef4444'}; font-size: 14px;">${msg.feedback === 'positive' ? '👍' : '👎'} Customer feedback: ${msg.feedback}</span></div>` : ''}
        </div>
      `;
    }).join('');
    
    // Build complete email HTML (simplified version - see server/routes.ts for full version)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💬 AI Chatbot Conversation Log</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Conversation Details</h2>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Session ID:</strong> ${conversation.sessionId}</p>
            <p><strong>Started:</strong> ${formatTime(conversation.startedAt)}</p>
          </div>
          <h3 style="color: #374151;">Conversation Messages</h3>
          ${conversationHtml}
        </div>
      </div>
    `;
    
    // Send email using Resend
    await sendEmail({
      to: adminEmail,
      subject: `Chatbot Conversation Log - ${formatTime(conversation.startedAt)}`,
      html: emailHtml,
      tags: [
        { name: 'type', value: 'chatbot-conversation' },
        { name: 'conversation_id', value: conversation.id }
      ]
    });
    
    console.log(`[Chatbot] Conversation ${id} emailed to ${adminEmail}`);
    return NextResponse.json({ success: true, message: "Conversation emailed successfully" });
    
  } catch (error) {
    console.error("Error emailing conversation:", error);
    return NextResponse.json(
      { error: "Failed to email conversation" },
      { status: 500 }
    );
  }
}
