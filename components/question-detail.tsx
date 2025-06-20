"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { ArrowLeft, ThumbsUp, ThumbsDown, Shield, CheckCircle, Plus, MessageSquare } from "lucide-react"
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

interface QuestionDetailProps {
  post: Post
  onBack: () => void
  onUpdate: (post: Post) => void
}

const ADMIN_TAGS = ["answered", "verified", "urgent", "official", "resolved", "important"]

export default function QuestionDetail({ post, onBack, onUpdate }: QuestionDetailProps) {
  const { user } = useAuth()
  const [newAnswer, setNewAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVotePost = (voteType: "up" | "down") => {
    if (!user?.id) return

    const currentVote = post.userVotes[user.id]
    let newVotes = post.votes
    const newUserVotes = { ...post.userVotes }

    if (currentVote === voteType) {
      delete newUserVotes[user.id]
      newVotes += voteType === "up" ? -1 : 1
    } else if (currentVote) {
      newUserVotes[user.id] = voteType
      newVotes += voteType === "up" ? 2 : -2
    } else {
      newUserVotes[user.id] = voteType
      newVotes += voteType === "up" ? 1 : -1
    }

    onUpdate({ ...post, votes: newVotes, userVotes: newUserVotes })
  }

  const handleVoteAnswer = (answerId: string, voteType: "up" | "down") => {
    if (!user?.id) return

    const updatedAnswers = post.answers.map((answer) => {
      if (answer.id === answerId) {
        const currentVote = answer.userVotes[user.id]
        let newVotes = answer.votes
        const newUserVotes = { ...answer.userVotes }

        if (currentVote === voteType) {
          delete newUserVotes[user.id]
          newVotes += voteType === "up" ? -1 : 1
        } else if (currentVote) {
          newUserVotes[user.id] = voteType
          newVotes += voteType === "up" ? 2 : -2
        } else {
          newUserVotes[user.id] = voteType
          newVotes += voteType === "up" ? 1 : -1
        }

        return { ...answer, votes: newVotes, userVotes: newUserVotes }
      }
      return answer
    })

    onUpdate({ ...post, answers: updatedAnswers })
  }

  const handleSubmitAnswer = async () => {
    if (!user || !newAnswer.trim()) return

    setIsSubmitting(true)

    const answer: Answer = {
      id: Date.now().toString(),
      content: newAnswer,
      author: user.username,
      authorId: user.id,
      authorAvatar: user.avatar,
      isAdmin: user.isAdmin || false,
      votes: 0,
      userVotes: {},
      createdAt: new Date().toISOString(),
    }

    const updatedAnswers = [...post.answers, answer]
    const updatedAdminTags = [...post.adminTags]

    // If admin answers, add "answered" tag and remove from other positions
    if (user.isAdmin) {
      if (!updatedAdminTags.includes("answered")) {
        updatedAdminTags.push("answered")
      }
      // Move admin answer to top
      updatedAnswers.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1
        if (!a.isAdmin && b.isAdmin) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    const updatedPost = {
      ...post,
      answers: updatedAnswers,
      adminTags: updatedAdminTags,
      isAnswered: updatedAdminTags.includes("answered"),
      hasAdminAnswer: updatedAnswers.some((a) => a.isAdmin),
    }

    onUpdate(updatedPost)
    setNewAnswer("")
    setIsSubmitting(false)
  }

  const addAdminTag = (tag: string) => {
    if (!user?.isAdmin) return

    const adminTags = post.adminTags.includes(tag) ? post.adminTags.filter((t) => t !== tag) : [...post.adminTags, tag]

    onUpdate({
      ...post,
      adminTags,
      isAnswered: adminTags.includes("answered"),
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getTagVariant = (tag: string) => {
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

  // Sort answers: admin answers first, then by votes
  const sortedAnswers = [...post.answers].sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1
    if (!a.isAdmin && b.isAdmin) return 1
    return b.votes - a.votes
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Community
      </Button>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                  <AvatarFallback>{post.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.author}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVotePost("up")}
                className={post.userVotes[user?.id || ""] === "up" ? "text-green-600" : ""}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className="font-medium text-lg">{post.votes}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVotePost("down")}
                className={post.userVotes[user?.id || ""] === "down" ? "text-red-600" : ""}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">{post.content}</p>

          <div className="flex flex-wrap gap-2">
            {post.adminTags.map((tag) => (
              <div key={tag} className="flex items-center gap-1">
                <Badge variant={getTagVariant(tag)} className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
                {user?.isAdmin && (
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => addAdminTag(tag)}>
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
            {user?.isAdmin && (
              <Select onValueChange={addAdminTag}>
                <SelectTrigger className="h-6 w-20 text-xs">
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
        </CardContent>
      </Card>

      {/* Answers Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-xl font-semibold">
            {post.answers.length} {post.answers.length === 1 ? "Answer" : "Answers"}
          </h3>
        </div>

        {sortedAnswers.map((answer) => (
          <Card key={answer.id} className={answer.isAdmin ? "border-green-200 bg-green-50/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={answer.authorAvatar || "/placeholder.svg"} />
                    <AvatarFallback>{answer.author.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{answer.author}</span>
                      {answer.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(answer.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVoteAnswer(answer.id, "up")}
                    className={answer.userVotes[user?.id || ""] === "up" ? "text-green-600" : ""}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{answer.votes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVoteAnswer(answer.id, "down")}
                    className={answer.userVotes[user?.id || ""] === "down" ? "text-red-600" : ""}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">{answer.content}</p>
              {answer.isAdmin && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Official response from emergency coordinator</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {post.answers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No answers yet. Be the first to help!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Answer Form */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Answer</CardTitle>
            <CardDescription>
              {user.isAdmin
                ? "Provide an official response as an emergency coordinator"
                : "Share your knowledge and help the community"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your answer here..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {user.isAdmin && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>This will be marked as an official admin response</span>
                  </div>
                )}
              </div>
              <Button onClick={handleSubmitAnswer} disabled={!newAnswer.trim() || isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
