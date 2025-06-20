import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Mail, Globe,ScanFace } from "lucide-react"
import { Facebook } from "lucide-react";

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  avatar?: string
  skills: string[]
  social: {
    github?: string
    linkedin?: string
    email?: string
    website?: string
    facebook?: string
  }
}

export default function Team() {
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Ilham Sajid",
      role: "Team Lead, Flood Simulation & Data Integration",
      bio: "Full-stack developer with 5+ years experience in emergency response systems. Passionate about using technology to save lives.",
      avatar: "/ilham.jpg",
      skills: ["Robotics", "Embedded C++", "GIS", "Graphics Design"],
      social: {
        github: "https://github.com/sajid17992",
        linkedin: "https://www.linkedin.com/in/ilham-sajid/",
        facebook: "https://www.facebook.com/ilham.sajid.2024/",
      },
    },
    {
      id: "2",
      name: "Mohammed Ahetasamul Rasul",
      role: "AI/ML, Data Analysis",
      bio: "UX designer turned developer, specializing in accessible and intuitive interfaces for crisis management applications.",
      avatar: "/turjo.png",
      skills: ["Python", "AI/ML", "Data Analysis", "Accessibility"],
      social: {
        github: "https://github.com/Ahetasamul1212",
        linkedin: "https://www.linkedin.com/in/mohammed-ahetasamul-rasul-7a8752309/",
        facebook: "https://www.facebook.com/ahetasam21212",
      },
    },
    {
      id: "3",
      name: "Fyaz Rayat",
      role: "Backend Developer & Data Engineer",
      bio: "Data engineer with expertise in real-time systems and emergency response APIs. Former FEMA technology consultant.",
      avatar: "/fyaz.jpg",
      skills: ["Python", "AI/ML", "React Native", "Flutter","Next js"],
      social: {
        github: "https://github.com/davidkim",
        linkedin: "https://www.linkedin.com/in/fyaz-rayat-6155831a7/",
        facebook: "https://www.facebook.com/fyaz.rayat.1",
      },
    },
    {
      id: "4",
      name: "Ishrat jannat Rahman",
      role: "Emergency Response Consultant",
      bio: "Former emergency coordinator with 10+ years in disaster response. Ensures our platform meets real-world emergency needs.",
      avatar: "/ishrat.jpeg",
      skills: ["Emergency Management", "Crisis Communication", "Training", "Coordination"],
      social: {
        linkedin: "https://www.linkedin.com/in/ishrat-jannat-rahman-a3032a231/",
        facebook: "https://www.facebook.com/ishrat.jannat.rahman",
      },
    },
        {
      id: "5",
      name: "Al Razi",
      role: "Emergency Response Consultant",
      bio: "Former emergency coordinator with 10+ years in disaster response. Ensures our platform meets real-world emergency needs.",
      avatar: "/alrazi.jpg",
      skills: ["Emergency Management", "Crisis Communication", "Training", "Coordination"],
      social: {
        linkedin: "https://linkedin.com/in/sarahjohnson",
        email: "sarah@floodsafe.com",
      },
    },
  ]

  const projectInfo = {
    mission:
      "To provide accessible, real-time flood safety information and community support during emergency situations.",
    vision: "A world where everyone has immediate access to life-saving information during flood emergencies.",
    values: ["Accessibility", "Community", "Reliability", "Innovation", "Safety"],
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Meet Our Team</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're a dedicated team of developers, designers, and emergency response experts committed to building
          technology that saves lives during flood emergencies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-base font-medium text-blue-600">{member.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{member.bio}</p>

              <div className="space-y-2">
                <h4 className="font-medium">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {member.social.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {member.social.linkedin && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {member.social.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${member.social.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {member.social.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={member.social.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                  {member.social.facebook && (
                    <Button variant="outline" size="sm" asChild>
                     <a href={member.social.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4" /> {/* Use a Facebook icon */}
                     </a>
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{projectInfo.mission}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{projectInfo.vision}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {projectInfo.values.map((value) => (
                <Badge key={value} variant="outline">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Project Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Flood Factor was created to solve a critical gap in flood response: the lack of real-time, location-specific insights and coordinated action. In climate-vulnerable countries like Bangladesh, delayed forecasts and scattered aid efforts have left many communities unprotected.
            Our platform combines machine learning, rainfall prediction, and a WaterGate-inspired simulation engine to model how floods spread across real terrain. Users can input their location and see a 3D simulation of water flow, depth, and risk — tailored to their area.
            Beyond simulation, Flood Factor builds community resilience. It features a live reporting dashboard where citizens can request help or share local conditions, turning communities into powerful networks of information.
            Fast, accurate, and accessible — Flood Factor empowers people to prepare, respond, and survive.
          </p>
          <p className="text-muted-foreground">
            The platform integrates multiple data sources, provides interactive mapping of safe houses, enables
            community communication, and offers comprehensive emergency statistics. Built with modern web technologies,
            it ensures accessibility across all devices and connection speeds, because emergencies don't wait for
            perfect conditions.
          </p>
          <div className="text-center pt-4">
            <Button asChild>
              <a href="mailto:team@floodsafe.com">
                <Mail className="mr-2 h-4 w-4" />
                Contact Our Team
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
