import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  itemId?: string | null;
  itemName?: string | null;
}

export function ChatDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
  itemId,
  itemName,
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Find or create conversation
  useEffect(() => {
    if (!open || !currentUserId) return;

    const findOrCreateConversation = async () => {
      setLoading(true);
      try {
        // Find existing conversation where both users are participants
        const { data: userConversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', currentUserId);

        if (userConversations && userConversations.length > 0) {
          // Check each conversation to see if the recipient is also a participant
          for (const conv of userConversations) {
            const { data: convData } = await supabase
              .from('conversations')
              .select('id, item_id')
              .eq('id', conv.conversation_id)
              .single();

            if (!convData) continue;

            // Check if item_id matches
            const itemMatches = itemId ? convData.item_id === itemId : convData.item_id === null;
            if (!itemMatches) continue;

            // Check if recipient is also a participant
            const { data: recipientParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', convData.id)
              .eq('user_id', recipientId)
              .maybeSingle();

            if (recipientParticipant) {
              setConversationId(convData.id);
              return;
            }
          }
        }

        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ item_id: itemId || null })
          .select()
          .single();

        if (convError) throw convError;

        // Add both participants
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: recipientId },
          ]);

        if (partError) throw partError;

        setConversationId(newConv.id);
      } catch (error: any) {
        console.error('Error finding/creating conversation:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast.error(`Failed to open chat: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    findOrCreateConversation();
  }, [open, currentUserId, recipientId, itemId]);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data as Message[]);
    };

    loadMessages();

    // Mark messages as read
    supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId || '');

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            sender,
          } as Message;

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={recipientAvatar || undefined} />
              <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle>{recipientName}</DialogTitle>
              {itemName && (
                <p className="text-sm text-muted-foreground">About: {itemName}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender?.avatar_url || undefined} />
                          <AvatarFallback>
                            {message.sender?.full_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                        <div
                          className={`rounded-lg px-4 py-2 max-w-sm ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSend}
              className="px-6 py-4 border-t flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim() || !conversationId || loading}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
