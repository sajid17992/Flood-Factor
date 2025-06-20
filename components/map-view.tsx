"use client"

import { useState } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface Metadata {
  flooded_area_km2: number
  flooded_volume_m3: number
  latitude: number
  longitude: number
  bounding_box: {
    west: number
    south: number
    east: number
    north: number
  }
  peak_runoff_cfs: number
  mean_c_factor: number
  rainfall_intensity: number
  watershed_area_km2: number
}

interface ApiResponse {
  status: "success" | "error"
  files?: string[]
  metadata?: Metadata
  message?: string
}

export default function MapView() {
  const [address, setAddress] = useState("")
  const [duration, setDuration] = useState("")
  const [rainfallIntensity, setRainfallIntensity] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("http://localhost:5000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          duration: duration || undefined,
          rainfall_intensity: rainfallIntensity || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Request failed")
      }

      const data: ApiResponse = await res.json()
      setResult(data)
    } catch (err) {
      console.error("Request failed", err)
      setResult({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  const isImage = (file: string) => file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")
  const isHtml = (file: string) => file.endsWith(".html")

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Flood Simulation Request</CardTitle>
          <CardDescription>
            Enter an address to simulate flood impact. Duration and rainfall intensity are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Address *</Label>
            <Input
              placeholder="e.g. Feni River, Feni, Bangladesh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Duration (hours, optional)</Label>
              <Input
                placeholder="e.g. 150"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                type="number"
              />
            </div>
            <div>
              <Label>Rainfall Intensity (inches/hour, optional)</Label>
              <Input
                placeholder="e.g. 2.0"
                value={rainfallIntensity}
                onChange={(e) => setRainfallIntensity(e.target.value)}
                type="number"
                step="0.1"
              />
              <p className="text-sm text-slate-500 mt-1">
                Typical values: 1-5 inches/hour. Default: 2.0 inches/hour.
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!address || loading}>
            {loading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Processing...</> : "Submit"}
          </Button>
        </CardContent>
      </Card>

      {result?.status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {result?.status === "success" && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>Outputs and metadata from your flood simulation:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metadata Display */}
            {result.metadata && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Simulation Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Flooded Area:</strong> {result.metadata.flooded_area_km2.toFixed(2)} km²</p>
                    <p><strong>Flooded Volume:</strong> {result.metadata.flooded_volume_m3.toFixed(2)} m³</p>
                    <p><strong>Watershed Area:</strong> {result.metadata.watershed_area_km2.toFixed(2)} km²</p>
                    <p><strong>Peak Runoff:</strong> {result.metadata.peak_runoff_cfs.toFixed(2)} ft³/s</p>
                  </div>
                  <div>
                    <p><strong>Mean Runoff Coefficient:</strong> {result.metadata.mean_c_factor.toFixed(2)}</p>
                    <p><strong>Rainfall Intensity:</strong> {result.metadata.rainfall_intensity.toFixed(1)} inches/hour</p>
                    <p><strong>Location:</strong> Lat {result.metadata.latitude.toFixed(6)}, Lon {result.metadata.longitude.toFixed(6)}</p>
                    <p><strong>Bounding Box:</strong> W {result.metadata.bounding_box.west.toFixed(6)}, S {result.metadata.bounding_box.south.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Outputs */}
            <h3 className="text-lg font-semibold">Output Files</h3>
            {result.files?.map((file, idx) => {
              const fullUrl = `http://localhost:5000${file}`
              const fileName = file.split("/").pop() || file
              if (isImage(file)) {
                return (
                  <div key={idx}>
                    <p className="text-sm text-slate-600 mb-1">{fileName}</p>
                    <img src={fullUrl} alt={fileName} className="border rounded-lg max-w-full" />
                  </div>
                )
              } else if (isHtml(file)) {
                return (
                  <div key={idx}>
                    <p className="text-sm text-slate-600 mb-1">{fileName}</p>
                    <iframe
                      src={fullUrl}
                      title="Flood Visualization"
                      className="w-full h-[500px] border rounded-lg"
                    ></iframe>
                  </div>
                )
              } else {
                return (
                  <div key={idx}>
                    <p className="text-sm text-slate-600">
                      <strong>{fileName}:</strong>{" "}
                      <a href={fullUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                        Download File
                      </a>
                    </p>
                  </div>
                )
              }
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}