"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  LogOut,
  Shield,
  Tag,
  CheckCircle,
  Users,
} from "lucide-react"
import QuestionDetail from "@/components/question-detail"
import { useAuth } from "@/components/auth-provider"

interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorAvatar?: string
  tags: string[]
  adminTags: string[]
  votes: number
  userVotes: { [userId: string]: "up" | "down" }
  answers: Answer[]
  createdAt: string
  isAnswered: boolean
  hasAdminAnswer: boolean
}

interface Answer {
  id: string
  content: string
  author: string
  authorId: string
  authorAvatar?: string
  isAdmin: boolean
  votes: number
  userVotes: { [userId: string]: "up" | "down" }
  createdAt: string
  isAccepted?: boolean
}

const ADMIN_TAGS = ["answered", "verified", "urgent", "official", "resolved", "important"]

const REGULAR_TAGS = [
  "evacuation",
  "shelter",
  "supplies",
  "routes",
  "safety",
  "preparation",
  "volunteer",
  "family",
  "pets",
  "medical",
  "transportation",
  "communication",
]

export default function Community() {
  const { user, login, register, logout, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"votes" | "recent" | "answered">("votes")
  const [newPost, setNewPost] = useState({ title: "", content: "", tags: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Auth form states
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({ username: "", password: "" })
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    loadPosts()
    loadAvailableTags()
  }, [])

  const loadPosts = () => {
    const savedPosts = localStorage.getItem("community-posts-v2")
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts))
    } else {
      // Initialize with sample posts
      const samplePosts: Post[] = [
        {
          id: "1",
          title: "Best evacuation routes from downtown area?",
          content:
            "Looking for the safest and fastest routes to get out of downtown during flood warnings. Any local insights?",
          author: "sarah",
          authorId: "2",
          tags: ["evacuation", "downtown", "routes"],
          adminTags: [],
          votes: 15,
          userVotes: {},
          answers: [
            {
              id: "a1",
              content:
                "I recommend taking Highway 5 north - it's on higher ground and usually stays clear during floods.",
              author: "user",
              authorId: "4",
              isAdmin: false,
              votes: 8,
              userVotes: {},
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isAnswered: false,
          hasAdminAnswer: false,
        },
        {
          id: "2",
          title: "Emergency supply checklist for families",
          content: "What should every family have ready for flood emergencies? Creating a comprehensive list.",
          author: "user",
          authorId: "4",
          tags: ["supplies", "family", "preparation"],
          adminTags: ["answered", "verified"],
          votes: 23,
          userVotes: {},
          answers: [
            {
              id: "a2",
              content:
                "Essential items: 3 days of water (1 gallon per person per day), non-perishable food, flashlights, batteries, first aid kit, medications, important documents in waterproof container, cash, emergency contact list.",
              author: "admin",
              authorId: "1",
              isAdmin: true,
              votes: 15,
              userVotes: {},
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              isAccepted: true,
            },
          ],
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          isAnswered: true,
          hasAdminAnswer: true,
        },
      ]
      setPosts(samplePosts)
      localStorage.setItem("community-posts-v2", JSON.stringify(samplePosts))
    }
  }

  const loadAvailableTags = () => {
    const savedTags = localStorage.getItem("available-tags")
    if (savedTags) {
      setAvailableTags(JSON.parse(savedTags))
    } else {
      setAvailableTags([...REGULAR_TAGS])
      localStorage.setItem("available-tags", JSON.stringify(REGULAR_TAGS))
    }
  }

  const savePosts = (updatedPosts: Post[]) => {
    setPosts(updatedPosts)
    localStorage.setItem("community-posts-v2", JSON.stringify(updatedPosts))
  }

  const handleAuth = async () => {
    setAuthError("")
    const { username, password } = authForm

    if (!username.trim() || !password.trim()) {
      setAuthError("Please fill in all fields")
      return
    }

    let success = false
    if (authMode === "login") {
      success = await login(username, password)
      if (!success) {
        setAuthError("Invalid username or password")
      }
    } else {
      success = await register(username, password)
      if (!success) {
        setAuthError("Username already exists")
      }
    }

    if (success) {
      setAuthForm({ username: "", password: "" })
    }
  }

  const handleVote = (postId: string, voteType: "up" | "down") => {
    if (!user?.id) return

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const currentVote = post.userVotes[user.id]
        let newVotes = post.votes
        const newUserVotes = { ...post.userVotes }

        if (currentVote === voteType) {
          // Remove vote
          delete newUserVotes[user.id]
          newVotes += voteType === "up" ? -1 : 1
        } else if (currentVote) {
          // Change vote
          newUserVotes[user.id] = voteType
          newVotes += voteType === "up" ? 2 : -2
        } else {
          // New vote
          newUserVotes[user.id] = voteType
          newVotes += voteType === "up" ? 1 : -1
        }

        return { ...post, votes: newVotes, userVotes: newUserVotes }
      }
      return post
    })
    savePosts(updatedPosts)
  }

  const handleSubmitPost = () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return

    const postTags = newPost.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    // Add new tags to available tags
    const newTags = postTags.filter((tag) => !availableTags.includes(tag))
    if (newTags.length > 0) {
      const updatedTags = [...availableTags, ...newTags]
      setAvailableTags(updatedTags)
      localStorage.setItem("available-tags", JSON.stringify(updatedTags))
    }

    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      author: user.username,
      authorId: user.id,
      authorAvatar: user.avatar,
      tags: postTags,
      adminTags: [],
      votes: 0,
      userVotes: {},
      answers: [],
      createdAt: new Date().toISOString(),
      isAnswered: false,
      hasAdminAnswer: false,
    }

    savePosts([post, ...posts])
    setNewPost({ title: "", content: "", tags: "" })
    setIsDialogOpen(false)
  }

  const addAdminTag = (postId: string, tag: string) => {
    if (!user?.isAdmin) return

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const adminTags = post.adminTags.includes(tag)
          ? post.adminTags.filter((t) => t !== tag)
          : [...post.adminTags, tag]

        return {
          ...post,
          adminTags,
          isAnswered: adminTags.includes("answered"),
        }
      }
      return post
    })
    savePosts(updatedPosts)
  }

  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.adminTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = tagFilter === "all" || post.tags.includes(tagFilter) || post.adminTags.includes(tagFilter)

      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      if (sortBy === "votes") {
        return b.votes - a.votes
      } else if (sortBy === "answered") {
        if (a.isAnswered !== b.isAnswered) {
          return a.isAnswered ? 1 : -1 // Unanswered first
        }
        return b.votes - a.votes
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getTagVariant = (tag: string) => {
    if (ADMIN_TAGS.includes(tag)) {
      switch (tag) {
        case "answered":
          return "default"
        case "verified":
          return "secondary"
        case "urgent":
          return "destructive"
        case "official":
          return "default"
        default:
          return "outline"
      }
    }
    return "outline"
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  if (selectedPost) {
    return (
      <QuestionDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onUpdate={(updatedPost) => {
          const updatedPosts = posts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
          savePosts(updatedPosts)
          setSelectedPost(updatedPost)
        }}
      />
    )
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Join the Community</CardTitle>
          <CardDescription>
            Sign in to participate in community discussions, ask questions, and share information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
                {authError && <p className="text-sm text-red-600">{authError}</p>}
                <Button onClick={handleAuth} className="w-full">
                  Sign In
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Demo accounts:</strong>
                </p>
                <p>Admin: admin / admin123</p>
                <p>User: user / user123</p>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    placeholder="Choose username"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Choose password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
                {authError && <p className="text-sm text-red-600">{authError}</p>}
                <Button onClick={handleAuth} className="w-full">
                  Create Account
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Forum</h2>
          <p className="text-muted-foreground">Share information and ask questions about flood safety</p>
        </div>
        <div className="flex items-center gap-2">
          {user.isAdmin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
          <span className="text-sm">Welcome, {user.username}</span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions, tags, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-48">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            <Separator />
            {ADMIN_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  {tag}
                </div>
              </SelectItem>
            ))}
            <Separator />
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant={sortBy === "votes" ? "default" : "outline"} size="sm" onClick={() => setSortBy("votes")}>
            Top Voted
          </Button>
          <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
            Recent
          </Button>
          <Button
            variant={sortBy === "answered" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("answered")}
          >
            Unanswered
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>Share your question with the community to get help and insights</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's your question?"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="content">Description</Label>
                <Textarea
                  id="content"
                  placeholder="Provide more details about your question..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="evacuation, safety, shelter..."
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmitPost} className="w-full">
                Post Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-lg hover:text-blue-600 transition-colors">{post.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{post.author.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, "up")
                    }}
                    className={post.userVotes[user.id] === "up" ? "text-green-600" : ""}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{post.votes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, "down")
                    }}
                    className={post.userVotes[user.id] === "down" ? "text-red-600" : ""}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-2">{post.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {post.adminTags.map((tag) => (
                    <div key={tag} className="flex items-center gap-1">
                      <Badge variant={getTagVariant(tag)} className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                      {user.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            addAdminTag(post.id, tag)
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {user.isAdmin && (
                    <Select onValueChange={(tag) => addAdminTag(post.id, tag)}>
                      <SelectTrigger className="h-6 w-20 text-xs" onClick={(e) => e.stopPropagation()}>
                        <Plus className="h-3 w-3" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_TAGS.filter((tag) => !post.adminTags.includes(tag)).map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              {tag}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.answers.length} answers</span>
                  </div>
                  {post.hasAdminAnswer && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Admin answered</span>
                    </div>
                  )}
                  {post.answers.length > 0 && !post.hasAdminAnswer && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users className="h-4 w-4" />
                      <span>Community answered</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || tagFilter !== "all"
                ? "No posts found matching your search."
                : "No posts yet. Be the first to ask a question!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
