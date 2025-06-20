"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, MapPin, AlertTriangle, Shield, Activity } from "lucide-react"

export default function Statistics() {
  const stats = {
    totalSafeHouses: 24,
    currentOccupancy: 1247,
    totalCapacity: 3200,
    activeAlerts: 3,
    rescueOperations: 12,
    communityPosts: 156,
  }

  const recentAlerts = [
    { id: 1, type: "flood", location: "Downtown District", severity: "high", time: "2 hours ago" },
    { id: 2, type: "evacuation", location: "Riverside Area", severity: "medium", time: "4 hours ago" },
    { id: 3, type: "road_closure", location: "Highway 101", severity: "low", time: "6 hours ago" },
  ]

  const occupancyData = [
    { name: "Central Community Center", occupancy: 75, capacity: 200 },
    { name: "Riverside School", occupancy: 120, capacity: 150 },
    { name: "Highland Shelter", occupancy: 100, capacity: 100 },
    { name: "Westside Recreation", occupancy: 30, capacity: 180 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Safe Houses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSafeHouses}</div>
            <p className="text-xs text-muted-foreground">+2 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentOccupancy}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalCapacity} total capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">2 high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rescue Operations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rescueOperations}</div>
            <p className="text-xs text-muted-foreground">+3 since yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.communityPosts}</div>
            <p className="text-xs text-muted-foreground">+12 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.currentOccupancy / stats.totalCapacity) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall utilization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest emergency notifications and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === "high"
                          ? "destructive"
                          : alert.severity === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {alert.type.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-medium">{alert.location}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
                <AlertTriangle
                  className={`h-4 w-4 ${
                    alert.severity === "high"
                      ? "text-red-500"
                      : alert.severity === "medium"
                        ? "text-yellow-500"
                        : "text-gray-500"
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shelter Occupancy</CardTitle>
            <CardDescription>Current capacity usage by location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {occupancyData.map((shelter) => (
              <div key={shelter.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{shelter.name}</span>
                  <span className="text-muted-foreground">
                    {shelter.occupancy}/{shelter.capacity}
                  </span>
                </div>
                <Progress value={(shelter.occupancy / shelter.capacity) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Response Timeline</CardTitle>
          <CardDescription>Recent emergency response activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New safe house opened at Community Center East</p>
                <p className="text-xs text-muted-foreground">2 hours ago • Capacity: 150 people</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Evacuation order issued for Riverside District</p>
                <p className="text-xs text-muted-foreground">4 hours ago • Affected: ~500 residents</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Emergency supplies delivered to Highland Shelter</p>
                <p className="text-xs text-muted-foreground">6 hours ago • Food, water, and medical supplies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
