import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ itemId }) {
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const queryClient = useQueryClient();
  const textareaRef = React.useRef(null);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => base44.entities.Comment.filter({ item_id: itemId }, '-created_date'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: item } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId,
  });

  const { data: venture } = useQuery({
    queryKey: ['venture', item?.venture_id],
    queryFn: async () => {
      const ventures = await base44.entities.Venture.filter({ id: item.venture_id });
      return ventures[0];
    },
    enabled: !!item?.venture_id,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', venture?.team_id],
    queryFn: () => base44.entities.TeamMember.filter({ team_id: venture.team_id }),
    enabled: !!venture?.team_id,
  });

  // Get relevant users (team members + assigned user + creator)
  const relevantUsers = React.useMemo(() => {
    const userEmails = new Set();
    
    // Add team members
    teamMembers.forEach(member => userEmails.add(member.user_email));
    
    // Add assigned user
    if (item?.assigned_to) userEmails.add(item.assigned_to);
    
    // Add creator
    if (item?.created_by) userEmails.add(item.created_by);
    
    return allUsers.filter(user => userEmails.has(user.email));
  }, [allUsers, teamMembers, item]);

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const comment = await base44.entities.Comment.create(commentData);
      
      // Create notifications for mentions
      if (commentData.mentions?.length > 0) {
        const notifications = commentData.mentions.map(email => ({
          user_email: email,
          type: 'mention',
          item_id: itemId,
          message: `${currentUser.full_name || currentUser.email} mentioned you in a comment`,
          related_user: currentUser.email,
        }));
        await base44.entities.Notification.bulkCreate(notifications);
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setNewComment('');
    },
  });

  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(cursorPos);

    // Check if @ was just typed
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (user) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeAt = newComment.substring(0, lastAtIndex);
    const mention = `@${user.full_name || user.email} `;
    const newText = beforeAt + mention + textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeAt.length + mention.length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredUsers = React.useMemo(() => {
    if (!mentionSearch) return relevantUsers;
    const search = mentionSearch.toLowerCase();
    return relevantUsers.filter(user => 
      (user.full_name?.toLowerCase().includes(search)) ||
      user.email.toLowerCase().includes(search)
    );
  }, [relevantUsers, mentionSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Extract mentions by looking for @Name or @email patterns
    const mentions = [];
    relevantUsers.forEach(user => {
      const namePattern = user.full_name ? `@${user.full_name}` : null;
      const emailPattern = `@${user.email}`;
      
      if ((namePattern && newComment.includes(namePattern)) || newComment.includes(emailPattern)) {
        mentions.push(user.email);
      }
    });

    createCommentMutation.mutate({
      item_id: itemId,
      content: newComment,
      mentions: mentions.length > 0 ? mentions : undefined,
    });
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No comments yet</p>
        ) : (
          comments.map((comment) => {
            const user = allUsers.find(u => u.email === comment.created_by);
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                    {getInitials(user?.full_name, comment.created_by)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {user?.full_name || comment.created_by}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2 relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            placeholder="Add a comment... (type @ to mention someone)"
            rows={3}
            className="resize-none text-sm"
          />
          
          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filteredUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100 last:border-b-0"
                >
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {user.full_name || user.email}
                    </div>
                    {user.full_name && (
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Send className="w-3 h-3 mr-1" />
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
}