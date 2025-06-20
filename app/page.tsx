"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MapView from "@/components/map-view"
import Statistics from "@/components/statistics"
import Community from "@/components/community"
import Team from "@/components/team"
import { MapPin, BarChart3, Users, MessageSquare } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {/* Add the logo */}
          <img src="/flood_factor.png" alt="Flood Factor Logo" className="h-20 w-25" />
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Flood Factor</h1>
            <p className="text-muted-foreground">Flood Prediction, Analysis and Community Platform</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Compute
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <MapView />
          </TabsContent>

          <TabsContent value="statistics">
            <Statistics />
          </TabsContent>

          <TabsContent value="community">
            <Community />
          </TabsContent>

          <TabsContent value="team">
            <Team />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
