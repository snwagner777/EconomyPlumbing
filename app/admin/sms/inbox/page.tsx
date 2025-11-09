'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Inbox as InboxIcon, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SMSConversation = {
  id: number;
  phone: string;
  contactId: number | null;
  contactName: string | null;
  lastMessageAt: string;
  lastMessageBody: string;
  lastMessageDirection: 'inbound' | 'outbound';
  unreadCount: number;
  totalMessages: number;
};

type SMSMessage = {
  id: number;
  conversationId: number;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
};

export default function SMSInboxPage() {
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<SMSConversation[]>({
    queryKey: ['/api/admin/sms/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<SMSMessage[]>({
    queryKey: ['/api/admin/sms/conversations', selectedConversationId, 'messages'],
    enabled: !!selectedConversationId,
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest(
        'PATCH',
        `/api/admin/sms/conversations/${conversationId}`,
        { unreadCount: 0 }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/conversations'] });
    },
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: number; body: string }) => {
      const response = await apiRequest(
        'POST',
        `/api/admin/sms/conversations/${conversationId}/messages`,
        { body }
      );
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/conversations', variables.conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/conversations'] });
      setReplyMessage('');
      toast({ title: 'Message sent successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    },
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const searchLower = search.toLowerCase();
    return (
      conv.phone.includes(searchLower) ||
      conv.contactName?.toLowerCase().includes(searchLower) ||
      conv.lastMessageBody.toLowerCase().includes(searchLower)
    );
  });

  const handleSendReply = () => {
    if (!selectedConversationId || !replyMessage.trim()) return;

    sendReplyMutation.mutate({
      conversationId: selectedConversationId,
      body: replyMessage.trim(),
    });
  };

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            SMS Inbox
          </h1>
          <p className="text-muted-foreground">
            2-way messaging with customers
            {unreadCount > 0 && ` (${unreadCount} unread)`}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className="col-span-4 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <InboxIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No conversations</h3>
                <p className="text-sm text-muted-foreground">
                  {search ? 'No conversations match your search' : 'Start a conversation by sending a campaign'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      if (conv.unreadCount > 0) {
                        markAsReadMutation.mutate(conv.id);
                      }
                    }}
                    className={cn(
                      'w-full p-4 text-left transition-colors hover-elevate',
                      selectedConversationId === conv.id && 'bg-muted'
                    )}
                    data-testid={`button-conversation-${conv.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {conv.contactName || conv.phone}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {conv.lastMessageDirection === 'outbound' && 'You: '}
                      {conv.lastMessageBody}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(conv.lastMessageAt).toLocaleString()}</span>
                      <span>{conv.totalMessages} messages</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Messages Panel */}
        <Card className="col-span-8 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div>
                <InboxIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold" data-testid="text-conversation-name">
                      {selectedConversation.contactName || selectedConversation.phone}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.phone}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {selectedConversation.totalMessages} messages
                  </Badge>
                </div>
              </div>

              {/* Messages List */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages in this conversation
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                        )}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            message.direction === 'outbound'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <div
                            className={cn(
                              'flex items-center gap-2 mt-1 text-xs',
                              message.direction === 'outbound'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          >
                            <span>{new Date(message.sentAt).toLocaleTimeString()}</span>
                            {message.direction === 'outbound' && message.status === 'delivered' && (
                              <span>✓ Delivered</span>
                            )}
                            {message.direction === 'outbound' && message.status === 'failed' && (
                              <span className="text-red-400">✗ Failed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply Composer */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="resize-none"
                    rows={3}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    data-testid="textarea-reply"
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                      data-testid="button-send"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <div className="text-xs text-muted-foreground text-center">
                      {replyMessage.length}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
