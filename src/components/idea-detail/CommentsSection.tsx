import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  authorInitial: string;
  content: string;
  timeAgo: string;
  likes: number;
  replies: number;
  isCreator?: boolean;
}

const mockComments: Comment[] = [
  {
    id: "1",
    author: "Alex Rivera",
    authorInitial: "A",
    content: "Love this concept! I've been looking for something exactly like this. The AI-powered validation reports would save me so much time doing market research manually.",
    timeAgo: "2 hours ago",
    likes: 12,
    replies: 3,
  },
  {
    id: "2",
    author: "Jordan Chen",
    authorInitial: "J",
    content: "How would you handle spam or low-quality feedback? That's always been a problem with other validation platforms I've tried.",
    timeAgo: "4 hours ago",
    likes: 8,
    replies: 1,
    isCreator: false,
  },
  {
    id: "3",
    author: "Sam Taylor",
    authorInitial: "S",
    content: "Great question @Jordan! We're planning to use a combination of account verification, rate limiting, and AI-powered quality scoring to filter out low-quality signals.",
    timeAgo: "3 hours ago",
    likes: 15,
    replies: 0,
    isCreator: true,
  },
  {
    id: "4",
    author: "Morgan Lee",
    authorInitial: "M",
    content: "Would love to see integration with tools like Notion or Linear for tracking validated ideas through the build process.",
    timeAgo: "6 hours ago",
    likes: 6,
    replies: 2,
  },
];

const CommentsSection = () => {
  const [commentText, setCommentText] = useState("");

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({mockComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Input */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts or ask a question..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button variant="hero" size="sm" disabled={!commentText.trim()}>
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          {mockComments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${comment.isCreator ? 'bg-gradient-hero text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {comment.authorInitial}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    {comment.isCreator && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        Creator
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm">
            Load more comments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
