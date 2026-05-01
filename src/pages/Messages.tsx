import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { ChatDialog } from '@/components/chat/ChatDialog';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  item_id: string | null;
  updated_at: string;
  item?: {
    name: string;
    image_urls: string[] | null;
  };
  other_participant?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count?: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<{
    recipientId: string;
    recipientName: string;
    recipientAvatar: string | null;
    itemId?: string | null;
    itemName?: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Get all conversations where user is a participant
        const { data: convData, error: convError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversations:conversation_id (
              id,
              item_id,
              updated_at,
              inventory_items:item_id (
                name,
                image_urls
              )
            )
          `)
          .eq('user_id', currentUserId);

        if (convError) throw convError;

        // For each conversation, get the other participant and last message
        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv: any) => {
            const conversationId = conv.conversations.id;

            // Get other participant
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id, profiles:user_id(id, full_name, avatar_url)')
              .eq('conversation_id', conversationId)
              .neq('user_id', currentUserId)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            const { data: participant } = await supabase
              .from('conversation_participants')
              .select('last_read_at')
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId)
              .single();

            let unreadCount = 0;
            if (participant?.last_read_at) {
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', currentUserId)
                .gt('created_at', participant.last_read_at);
              unreadCount = count || 0;
            }

            return {
              id: conversationId,
              item_id: conv.conversations.item_id,
              updated_at: conv.conversations.updated_at,
              item: conv.conversations.inventory_items,
              other_participant: otherParticipant?.profiles,
              last_message: lastMessage,
              unread_count: unreadCount,
            };
          })
        );

        // Sort by most recent activity
        conversationsWithDetails.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.updated_at;
          const bTime = b.last_message?.created_at || b.updated_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setConversations(conversationsWithDetails as Conversation[]);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Please log in to view messages.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Messages</h1>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No conversations yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a conversation by messaging a friend or asking about an item!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    if (conversation.other_participant) {
                      setSelectedChat({
                        recipientId: conversation.other_participant.id,
                        recipientName: conversation.other_participant.full_name,
                        recipientAvatar: conversation.other_participant.avatar_url,
                        itemId: conversation.item_id,
                        itemName: conversation.item?.name,
                      });
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={conversation.other_participant?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {conversation.other_participant?.full_name[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">
                            {conversation.other_participant?.full_name || 'Unknown User'}
                          </h3>
                          {conversation.last_message && (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatDistanceToNow(
                                new Date(conversation.last_message.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>

                        {conversation.item && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            About: {conversation.item.name}
                          </Badge>
                        )}

                        {conversation.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.content}
                          </p>
                        )}

                        {conversation.unread_count! > 0 && (
                          <Badge variant="default" className="mt-2">
                            {conversation.unread_count} new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedChat && (
        <ChatDialog
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
          recipientId={selectedChat.recipientId}
          recipientName={selectedChat.recipientName}
          recipientAvatar={selectedChat.recipientAvatar}
          itemId={selectedChat.itemId}
          itemName={selectedChat.itemName}
        />
      )}
    </div>
  );
}
