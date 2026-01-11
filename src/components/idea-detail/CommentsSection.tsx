import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  getCommentsByIdea,
  createComment,
  deleteComment,
  toggleCommentLike,
  getUserLikedCommentIds,
  Comment,
} from "@/integrations/firebase/commentService";
import { getUserProfile } from "@/integrations/firebase/userService";

interface CommentWithProfile extends Comment {
  profiles: {
    display_name: string | null;
    user_name: string | null;
  } | null;
}

interface CommentsSectionProps {
  ideaId: string;
  ideaOwnerId: string;
}

const CommentsSection = ({ ideaId, ideaOwnerId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const fetchComments = async () => {
    console.log("fetchComments called for ideaId:", ideaId);
    try {
      const commentsData = await getCommentsByIdea(ideaId);
      console.log("Raw comments data:", commentsData);

      if (commentsData.length === 0) {
        console.log("No comments found for this idea");
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all comment authors
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      console.log("Fetching profiles for userIds:", userIds);
      const profiles = await Promise.all(
        userIds.map((userId) => getUserProfile(userId))
      );
      console.log("Profiles fetched:", profiles);

      const profilesMap = new Map(
        profiles.filter((p) => p !== null).map((p) => [p!.id, p])
      );

      const commentsWithProfiles: CommentWithProfile[] = commentsData.map((c) => {
        const profile = profilesMap.get(c.user_id);
        return {
          ...c,
          profiles: profile
            ? { display_name: profile.display_name, user_name: profile.user_name }
            : null,
        };
      });

      console.log("Final comments with profiles:", commentsWithProfiles);
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const likedIds = await getUserLikedCommentIds(ideaId, user.id);
      setLikedComments(new Set(likedIds));
    } catch (error) {
      console.error("Error fetching user likes:", error);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchUserLikes();
  }, [ideaId, user]);

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;

    setSubmitting(true);

    try {
      await createComment(ideaId, user.id, commentText.trim());
      setCommentText("");
      fetchComments();
      toast({
        title: "Comment posted!",
        description: "Your feedback has been shared.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like comments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const nowLiked = await toggleCommentLike(commentId, user.id);

      if (nowLiked) {
        setLikedComments((prev) => new Set(prev).add(commentId));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c
          )
        );
      } else {
        setLikedComments((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes_count: c.likes_count - 1 } : c
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId, ideaId);
      fetchComments();
      toast({
        title: "Comment deleted",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitial = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Input */}
        {user ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts or ask a question..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button
                variant="hero"
                size="sm"
                disabled={!commentText.trim() || submitting}
                onClick={handleSubmitComment}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground mb-2">Sign in to leave a comment</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => {
              const isCreator = comment.user_id === ideaOwnerId;
              const isOwn = comment.user_id === user?.id;
              const displayName =
                comment.profiles?.display_name ||
                comment.profiles?.user_name ||
                "Anonymous";

              return (
                <div key={comment.id} className="group">
                  <div className="flex gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isCreator
                          ? "bg-gradient-hero text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getInitial(displayName)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{displayName}</span>
                        {isCreator && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            Creator
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            likedComments.has(comment.id)
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{comment.likes_count}</span>
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
