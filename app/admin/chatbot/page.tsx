'use client';

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive,
  Eye,
  MessageSquare,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  Image as ImageIcon,
  Mail,
  Download,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Conversation {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  rating: number | null;
  archived: boolean;
  notes: string | null;
  pageContext: string | null;
  messageCount?: number;
  lastMessage?: string;
  customerName?: string;
  customerEmail?: string;
}

interface Message {
  id: number;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  feedback: "positive" | "negative" | null;
  imageUrl: string | null;
}

interface Analytics {
  totalConversations: number;
  activeConversations: number;
  averageRating: number;
  totalFeedback: {
    positive: number;
    negative: number;
  };
  commonQuestions: Array<{
    question: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

interface QuickResponse {
  id: number;
  label: string;
  message: string;
  category: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function ChatbotAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingQuickResponse, setEditingQuickResponse] = useState<QuickResponse | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/chatbot/conversations"],
    select: (data: any) => Array.isArray(data) ? data : (data?.conversations ?? []),
  });

  // Fetch analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<Analytics>({
    queryKey: ["/api/admin/chatbot/analytics"],
  });

  // Fetch quick responses
  const { data: quickResponses = [], isLoading: loadingQuickResponses, refetch: refetchQuickResponses } = useQuery<QuickResponse[]>({
    queryKey: ["/api/admin/chatbot/quick-responses"],
  });

  // Archive conversation mutation
  const archiveConversation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return apiRequest("PATCH", `/api/admin/chatbot/conversation/${id}`, { archived });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Conversation updated successfully",
      });
      refetchConversations();
      if (selectedConversation) {
        setSelectedConversation(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    },
  });

  // Update conversation notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/chatbot/conversation/${id}`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
      refetchConversations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    },
  });

  // Create/Update quick response
  const saveQuickResponse = useMutation({
    mutationFn: async (data: Partial<QuickResponse>) => {
      if (data.id) {
        return apiRequest("PATCH", `/api/admin/chatbot/quick-responses/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/chatbot/quick-responses", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quick response saved successfully",
      });
      refetchQuickResponses();
      setEditingQuickResponse(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save quick response",
        variant: "destructive",
      });
    },
  });

  // Delete quick response
  const deleteQuickResponse = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chatbot/quick-responses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quick response deleted successfully",
      });
      refetchQuickResponses();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quick response",
        variant: "destructive",
      });
    },
  });

  // Load conversation details
  const loadConversationDetails = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/chatbot/conversation/${conversation.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load conversation details:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Email conversation
  const emailConversation = async (conversationId: string) => {
    try {
      await apiRequest("POST", `/api/admin/chatbot/conversation/${conversationId}/email`);
      toast({
        title: "Success",
        description: "Conversation emailed to admin successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to email conversation",
        variant: "destructive",
      });
    }
  };

  // Export conversations
  const exportConversations = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/admin/chatbot/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chatbot-conversations-${new Date().toISOString().split("T")[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Success",
          description: `Conversations exported as ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export conversations",
        variant: "destructive",
      });
    }
    setShowExportDialog(false);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv: Conversation) => {
    if (filterStatus === "active" && conv.archived) return false;
    if (filterStatus === "archived" && !conv.archived) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.customerName?.toLowerCase().includes(query) ||
        conv.customerEmail?.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query) ||
        conv.pageContext?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Chatbot Management</h1>
          <p className="text-muted-foreground">
            Monitor conversations, analyze engagement, and manage responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetchConversations()} 
            variant="outline"
            data-testid="button-refresh-conversations"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowExportDialog(true)}
            data-testid="button-export-conversations"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations" data-testid="tab-conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="quick-responses" data-testid="tab-quick-responses">
            <Clock className="w-4 h-4 mr-2" />
            Quick Responses
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Archive className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Conversations</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-conversations"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="w-32" data-testid="select-filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConversations ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No conversations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConversations.map((conv: Conversation) => (
                        <TableRow key={conv.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{conv.customerName || "Anonymous"}</p>
                              {conv.customerEmail && (
                                <p className="text-sm text-muted-foreground">{conv.customerEmail}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{conv.messageCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {conv.pageContext || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {conv.rating ? (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                {conv.rating}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={conv.archived ? "secondary" : conv.endedAt ? "default" : "outline"}>
                              {conv.archived ? "Archived" : conv.endedAt ? "Ended" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => loadConversationDetails(conv)}
                                data-testid={`button-view-conversation-${conv.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => emailConversation(conv.id)}
                                data-testid={`button-email-conversation-${conv.id}`}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => archiveConversation.mutate({
                                  id: conv.id,
                                  archived: !conv.archived,
                                })}
                                data-testid={`button-archive-conversation-${conv.id}`}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? <Skeleton className="h-8 w-20" /> : analytics?.totalConversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? <Skeleton className="h-8 w-20" /> : analytics?.activeConversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently chatting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAnalytics ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    analytics?.averageRating?.toFixed(1) || "N/A"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <ThumbsUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="font-bold">{analytics?.totalFeedback?.positive || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="font-bold">{analytics?.totalFeedback?.negative || 0}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">User feedback</p>
              </CardContent>
            </Card>
          </div>

          {analytics?.commonQuestions && analytics.commonQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Common Questions</CardTitle>
                <CardDescription>Most frequently asked questions by customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.commonQuestions.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                      <span className="flex-1">{q.question}</span>
                      <Badge variant="secondary">{q.count} times</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quick Responses Tab */}
        <TabsContent value="quick-responses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quick Response Templates</CardTitle>
                  <CardDescription>
                    Manage predefined responses for common questions
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setEditingQuickResponse({} as QuickResponse)}
                  data-testid="button-add-quick-response"
                >
                  Add Response
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingQuickResponses ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {quickResponses.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No quick responses configured
                    </p>
                  ) : (
                    quickResponses.map((response: QuickResponse) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{response.label}</h4>
                            <Badge variant="outline">{response.category}</Badge>
                            {!response.isActive && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {response.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingQuickResponse(response)}
                            data-testid={`button-edit-quick-response-${response.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteQuickResponse.mutate(response.id)}
                            data-testid={`button-delete-quick-response-${response.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Configuration</CardTitle>
              <CardDescription>
                Configure chatbot behavior and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea
                  placeholder="Hi! How can I help you today?"
                  className="min-h-20"
                  data-testid="textarea-greeting-message"
                />
              </div>
              <div className="space-y-2">
                <Label>Auto-Response Delay (seconds)</Label>
                <Input 
                  type="number" 
                  defaultValue="1" 
                  min="0" 
                  max="10"
                  data-testid="input-response-delay"
                />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number" 
                  defaultValue="30" 
                  min="5" 
                  max="120"
                  data-testid="input-session-timeout"
                />
              </div>
              <Button className="w-full" data-testid="button-save-settings">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <div className="flex items-center gap-4 mt-2">
                  <Badge>{selectedConversation.pageContext || "Unknown Page"}</Badge>
                  <span className="text-sm">
                    Started {formatDistanceToNow(new Date(selectedConversation.startedAt), { addSuffix: true })}
                  </span>
                  {selectedConversation.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {selectedConversation.rating}/5
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {loadingMessages ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Uploaded"
                                className="rounded-lg max-w-full"
                              />
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                            {message.role === "assistant" && message.feedback && (
                              <div className="flex items-center">
                                {message.feedback === "positive" ? (
                                  <ThumbsUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <ThumbsDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add notes about this conversation..."
                  value={selectedConversation?.notes || ""}
                  onChange={(e) => {
                    if (selectedConversation) {
                      setSelectedConversation({
                        ...selectedConversation,
                        notes: e.target.value,
                      });
                    }
                  }}
                  className="min-h-32 mt-2"
                  data-testid="textarea-conversation-notes"
                />
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    if (selectedConversation && selectedConversation.notes) {
                      updateNotes.mutate({
                        id: selectedConversation.id,
                        notes: selectedConversation.notes,
                      });
                    }
                  }}
                  data-testid="button-save-notes"
                >
                  Save Notes
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => selectedConversation && emailConversation(selectedConversation.id)}
                  data-testid="button-email-conversation-detail"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Conversation
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    if (selectedConversation) {
                      archiveConversation.mutate({
                        id: selectedConversation.id,
                        archived: !selectedConversation.archived,
                      });
                    }
                  }}
                  data-testid="button-archive-conversation-detail"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {selectedConversation?.archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Response Edit Dialog */}
      <Dialog open={!!editingQuickResponse} onOpenChange={() => setEditingQuickResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuickResponse?.id ? "Edit" : "Add"} Quick Response
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={editingQuickResponse?.label || ""}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  label: e.target.value,
                })}
                placeholder="e.g., Schedule Service"
                data-testid="input-quick-response-label"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={editingQuickResponse?.message || ""}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  message: e.target.value,
                })}
                placeholder="The message that will be sent..."
                className="min-h-24"
                data-testid="textarea-quick-response-message"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editingQuickResponse?.category || "general"}
                onValueChange={(v) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  category: v,
                })}
              >
                <SelectTrigger data-testid="select-quick-response-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={editingQuickResponse?.sortOrder || 0}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  sortOrder: parseInt(e.target.value) || 0,
                })}
                min="0"
                data-testid="input-quick-response-sort-order"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quick-response-active"
                checked={editingQuickResponse?.isActive !== false}
                onChange={(e) => setEditingQuickResponse({
                  ...editingQuickResponse!,
                  isActive: e.target.checked,
                })}
                data-testid="checkbox-quick-response-active"
              />
              <Label htmlFor="quick-response-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingQuickResponse(null)}
                data-testid="button-cancel-quick-response"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveQuickResponse.mutate(editingQuickResponse!)}
                data-testid="button-save-quick-response"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Conversations</DialogTitle>
            <DialogDescription>
              Choose the format for exporting conversation data
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => exportConversations("csv")}
              data-testid="button-export-csv"
            >
              Export as CSV
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => exportConversations("json")}
              data-testid="button-export-json"
            >
              Export as JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}