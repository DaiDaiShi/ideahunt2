import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Lightbulb, Eye, MessageCircle, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserIdeasListProps {
  userId: string;
}

const UserIdeasList = ({ userId }: UserIdeasListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteIdeaId, setDeleteIdeaId] = useState<string | null>(null);

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["user-ideas", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", ideaId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", userId] });
      toast.success("Idea deleted successfully");
      setDeleteIdeaId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete idea: ${error.message}`);
    },
  });

  const handleEdit = (e: React.MouseEvent, ideaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit/${ideaId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, ideaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteIdeaId(ideaId);
  };

  const confirmDelete = () => {
    if (deleteIdeaId) {
      deleteMutation.mutate(deleteIdeaId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              My Ideas
            </CardTitle>
            <CardDescription>
              Ideas you've submitted for validation
            </CardDescription>
          </div>
          <Button asChild variant="hero" size="sm">
            <Link to="/submit">
              <Plus className="w-4 h-4 mr-1" />
              New Idea
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!ideas || ideas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>You haven't submitted any ideas yet.</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/submit">Submit your first idea</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <Link
                  key={idea.id}
                  to={`/idea/${idea.id}`}
                  className="block group"
                >
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {idea.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {idea.tagline}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={idea.status === "published" ? "default" : "secondary"}>
                          {idea.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleEdit(e, idea.id)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, idea.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {idea.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {idea.want_to_use_count + idea.willing_to_pay_count + idea.waitlist_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {idea.comments_count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteIdeaId} onOpenChange={(open) => !open && setDeleteIdeaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your idea
              and all associated validation signals and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserIdeasList;
