import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  ShieldCheck,
  User,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { MessageRecord, MessageSenderRole } from '../types';
import { messagesService } from '../services/messagesService';

interface ApplicationChatThreadProps {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  recipientUserId?: string | null;
  currentUserRole: MessageSenderRole; // 'admin' or 'applicant'
  currentUserEmail: string;
  title?: string;
  subtitle?: string;
  className?: string;
  minHeight?: string;
}

export const ApplicationChatThread: React.FC<ApplicationChatThreadProps> = ({
  applicationId,
  applicantName,
  applicantEmail,
  recipientUserId,
  currentUserRole,
  currentUserEmail,
  title,
  subtitle,
  className = '',
  minHeight = '380px',
}) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages for this application
  const fetchMessages = async () => {
    try {
      const res = await messagesService.getMessagesByApplication(applicationId);
      setMessages(res.data);

      // Mark unread messages sent to current role as read
      const unreadIds = res.data
        .filter((m) => {
          if (m.is_read) return false;
          if (currentUserRole === 'admin') {
            return m.sender_role === 'applicant';
          }
          return m.sender_role === 'admin';
        })
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await messagesService.markAsRead(unreadIds);
      }
    } catch (err) {
      console.warn('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and realtime subscription
  useEffect(() => {
    setIsLoading(true);
    fetchMessages();

    // Subscribe to realtime messages for this application
    const unsubscribe = messagesService.subscribeToMessages(
      applicationId,
      (newMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Mark as read if received by current user
        if (
          (currentUserRole === 'admin' && newMessage.sender_role === 'applicant') ||
          (currentUserRole === 'applicant' && newMessage.sender_role === 'admin')
        ) {
          messagesService.markAsRead([newMessage.id]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [applicationId, currentUserRole]);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      // Determine recipient user ID
      const targetRecipient =
        currentUserRole === 'admin'
          ? recipientUserId || applicantEmail
          : 'admin';

      const res = await messagesService.sendMessage({
        applicationId,
        recipientUserId: targetRecipient,
        senderEmail: currentUserEmail || (currentUserRole === 'admin' ? 'admin@vox-direct.com' : applicantEmail),
        senderRole: currentUserRole,
        content,
      });

      // Optimistically add to state if not already there
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.record.id)) return prev;
        return [...prev, res.record];
      });

      if (res.syncedToSupabase) {
        setSyncStatus('Message delivered via Supabase');
      } else {
        setSyncStatus('Message delivered via Desk Storage');
      }

      setTimeout(() => setSyncStatus(null), 3000);

      // -----------------------------------------------------------------------
      // Dispatch email notification (Non-blocking, silent try/catch)
      // -----------------------------------------------------------------------
      try {
        if (currentUserRole === 'admin') {
          // Objective 1: Admin sends message -> notify applicant
          fetch('/api/send-message-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail: applicantEmail,
              recipientName: applicantName,
              senderRole: 'admin',
              messageSnippet: content.slice(0, 140),
              dashboardUrl: 'https://vox-direct.com/dashboard',
            }),
          }).catch((err) => {
            console.warn('[Silent notification dispatch notice]:', err);
          });
        } else {
          // Objective 2: Applicant replies to admin -> notify admin
          const adminEmail = 'jc.dev.uk@gmail.com';
          fetch('/api/send-message-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail: adminEmail,
              recipientName: 'Admin',
              senderRole: 'applicant',
              messageSnippet: content.slice(0, 140),
              dashboardUrl: 'https://vox-direct.com/admin',
            }),
          }).catch((err) => {
            console.warn('[Silent notification dispatch notice]:', err);
          });
        }
      } catch (silentErr) {
        // Ensure UI does NOT fail if email notification dispatch encounters an error
        console.warn('[Silent notification error]:', silentErr);
      }
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-[#0F2A24] text-[#F4F1EA] px-4 py-3 border-b border-[#2A453D] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-[#163B33] border border-[#2A453D] flex items-center justify-center text-[#D4895A]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-normal text-[#F4F1EA]">
              {title || (currentUserRole === 'admin' ? `Correspondence with ${applicantName}` : 'Placement Desk Conversation')}
            </h4>
            <p className="text-[11px] text-[#B9C4BE]">
              {subtitle || (currentUserRole === 'admin' ? applicantEmail : 'Direct line with Vox Direct Intake Team')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus && (
            <span className="text-[11px] font-mono text-[#D4895A] bg-[#163B33] px-2 py-0.5 rounded-[4px] border border-[#2A453D] animate-in fade-in">
              {syncStatus}
            </span>
          )}
          <button
            type="button"
            onClick={fetchMessages}
            title="Refresh messages"
            className="p-1 rounded-[4px] text-[#B9C4BE] hover:text-[#F4F1EA] hover:bg-[#163B33] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F4]"
        style={{ minHeight, maxHeight: '460px' }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#7A7A72] text-xs gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#B5632F]" />
            <span>Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-[4px] bg-[#F1EDE5] border border-[#DDD7CB] mx-auto flex items-center justify-center text-[#8A9A92]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="font-serif text-sm text-[#1A1A18]">No messages exchanged yet</p>
            <p className="text-xs text-[#7A7A72] max-w-sm mx-auto leading-relaxed">
              {currentUserRole === 'admin'
                ? `Send an introductory note or vetting inquiry to ${applicantName}. They will see it in their applicant dashboard.`
                : 'Send a message or query directly to the Vox Direct placement team regarding your submission status.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_role === currentUserRole;
            const isAdminSender = msg.sender_role === 'admin';
            const dateObj = new Date(msg.created_at);
            const timeStr = dateObj.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = dateObj.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* Sender Tag */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#7A7A72]">
                  {isAdminSender ? (
                    <span className="font-semibold text-[#0F2A24] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#B5632F]" />
                      Vox Direct Admin
                    </span>
                  ) : (
                    <span className="font-medium text-[#4A4A44] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#8A9A92]" />
                      {applicantName || 'Applicant'}
                    </span>
                  )}
                  <span>·</span>
                  <span className="font-mono text-[10px] text-[#8A9A92]">
                    {dateStr} {timeStr}
                  </span>
                </div>

                {/* Message Bubble (Strictly 4px flat radius, zero rounded pill discipline) */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 text-xs rounded-[4px] leading-relaxed whitespace-pre-wrap break-words border ${
                    isAdminSender
                      ? 'bg-[#0F2A24] text-[#F4F1EA] border-[#2A453D] shadow-sm'
                      : 'bg-white text-[#1A1A18] border-[#DDD7CB] shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-[#8A9A92]">
                  {isMe && (
                    <span className="flex items-center gap-1">
                      {msg.is_read ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-[#166534]" />
                          <span className="text-[#166534]">Read</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-[#8A9A92]" />
                          <span>Sent</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-[#DDD7CB] flex flex-col sm:flex-row gap-2"
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            currentUserRole === 'admin'
              ? `Write a direct message to ${applicantName}... (Press Enter to send)`
              : 'Write a response or query to Vox Direct placement team... (Press Enter to send)'
          }
          className="flex-1 p-2.5 text-xs bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] focus:outline-none focus:border-[#B5632F] focus:ring-1 focus:ring-[#B5632F] resize-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="py-2.5 px-4 text-xs font-semibold bg-[#B5632F] hover:bg-[#9A4E20] disabled:opacity-50 text-white rounded-[4px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isSending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send Message</span>
        </button>
      </form>
    </div>
  );
};
