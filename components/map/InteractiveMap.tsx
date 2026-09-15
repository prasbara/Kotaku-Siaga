'use client'

import { useEffect, useRef, useState } from 'react'
import type { Report } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import type { CCTVPoint } from '@/lib/data/cctv-pantausemar'
import type { FloodEvent } from '@/types/flood-event'
import type { SafeRoutePreset } from '@/components/map/SafeRouteNavigator'

interface InteractiveMapProps {
  reports: Report[]
  sosList?: Array<{ id: string; sos_code: string; latitude: number; longitude: number; status: string; created_at: string; district_name?: string | null }>
  clusters?: Array<{ id: string; cluster_code: string; category: string; latitude: number; longitude: number; independent_reporter_count: number; report_count: number; radius_m: number; status: string }>
  viewMode?: 'markers' | 'heatmap' | 'both'
  onReportClick?: (report: Report) => void
  selectedReport?: Report | null
  onLocationSelect?: (lat: number, lng: number) => void
  interactive?: boolean
  height?: string
  center?: [number, number]
  zoom?: number
  cctvList?: CCTVPoint[]
  showCCTV?: boolean
  onCCTVClick?: (cctv: CCTVPoint) => void
  floodEvents?: FloodEvent[]
  showFloodEvents?: boolean
  onFloodEventClick?: (event: FloodEvent) => void
  activeSafeRoute?: SafeRoutePreset | null
}

// Kota Semarang Center
const DEFAULT_CENTER: [number, number] = [-6.9932, 110.4203]
const DEFAULT_ZOOM = 13
const EMPTY_CCTV: CCTVPoint[] = []
const EMPTY_FLOOD: FloodEvent[] = []

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function InteractiveMap({
  reports,
  sosList = [],
  clusters = [],
  viewMode = 'markers',
  onReportClick,
  selectedReport,
  onLocationSelect,
  interactive = true,
  height = '100%',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  cctvList = EMPTY_CCTV,
  showCCTV = false,
  onCCTVClick,
  floodEvents = EMPTY_FLOOD,
  showFloodEvents = true,
  onFloodEventClick,
  activeSafeRoute = null,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const circlesRef = useRef<unknown[]>([])
  const cctvMarkersRef = useRef<unknown[]>([])
  const floodMarkersRef = useRef<unknown[]>([])
  const sosMarkersRef = useRef<unknown[]>([])
  const clusterLayersRef = useRef<unknown[]>([])
  const safeRouteLayersRef = useRef<unknown[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || leafletMapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix leaflet asset path issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: interactive,
        dragging: interactive,
        zoomControl: false, // Custom placed or hidden
      })

      // Add Zoom control at bottom right
      if (interactive) {
        L.control.zoom({ position: 'bottomright' }).addTo(map)
      }

      // Tactical Dark Basemap via OpenStreetMap with custom dark CSS filter (no watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(map)

      if (onLocationSelect) {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng)
        })
      }

      leafletMapRef.current = map
      return map
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        const map = leafletMapRef.current as { remove: () => void }
        map.remove()
        leafletMapRef.current = null
      }
    }
  }, [isClient, interactive, onLocationSelect, center, zoom])

  // Update markers/heatmap when reports change
  useEffect(() => {
    if (!leafletMapRef.current || !isClient) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default
      const map = leafletMapRef.current as {
        addLayer: (layer: unknown) => void
        removeLayer: (layer: unknown) => void
      }

      // Clear existing layers
      markersRef.current.forEach((m) => map.removeLayer(m))
      circlesRef.current.forEach((c) => map.removeLayer(c))
      cctvMarkersRef.current.forEach((m) => map.removeLayer(m))
      floodMarkersRef.current.forEach((m) => map.removeLayer(m))
      sosMarkersRef.current.forEach((m) => map.removeLayer(m))
      clusterLayersRef.current.forEach((c) => map.removeLayer(c))
      safeRouteLayersRef.current.forEach((l) => map.removeLayer(l))
      markersRef.current = []
      circlesRef.current = []
      cctvMarkersRef.current = []
      floodMarkersRef.current = []
      sosMarkersRef.current = []
      clusterLayersRef.current = []
      safeRouteLayersRef.current = []

      reports.forEach((report) => {
        const isSelected = selectedReport?.id === report.id
        const urgency = report.urgency || 'sedang'

        // Tactical Civic Intelligence Color Tokens
        let colorBg = '#06B6D4'
        let colorBorder = '#22D3EE'
        let urgencyShort = 'S'
        let pulseClass = ''

        if (urgency === 'kritis') {
          colorBg = '#EF4444'
          colorBorder = '#F87171'
          urgencyShort = 'K'
          pulseClass = 'animate-ping'
        } else if (urgency === 'tinggi') {
          colorBg = '#F59E0B'
          colorBorder = '#FBBF24'
          urgencyShort = 'T'
        } else if (urgency === 'rendah') {
          colorBg = '#10B981'
          colorBorder = '#34D399'
          urgencyShort = 'R'
        }

        const size = isSelected ? 34 : 26

        // Tactical glowing custom div icon
        const icon = L.divIcon({
          className: 'custom-tactical-marker',
          html: `
            <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
              ${
                urgency === 'kritis'
                  ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${colorBg}; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
                  : ''
              }
              <div style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 9999px;
                background-color: ${colorBg};
                border: 2px solid ${isSelected ? '#FFFFFF' : colorBorder};
                box-shadow: 0 0 14px ${colorBg};
                display: flex;
                align-items: center;
                justify-content: center;
                color: #070e1b;
                font-family: 'JetBrains Mono', monospace;
                font-size: ${isSelected ? '12px' : '10px'};
                font-weight: 800;
                cursor: pointer;
                transition: transform 0.15s ease;
              ">
                ${urgencyShort}
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        const reportLat = report.latitude ?? report.lat ?? DEFAULT_CENTER[0]
        const reportLng = report.longitude ?? report.lng ?? DEFAULT_CENTER[1]

        if (viewMode === 'markers' || viewMode === 'both') {
          const marker = L.marker([reportLat, reportLng], { icon })

          // Popup
          const popupContent = document.createElement('div')
          popupContent.className = 'text-xs'
          const safeCode = escapeHtml(report.report_code || 'SMG-ALERT')
          const safeUrgency = escapeHtml(urgency.toUpperCase())
          const safeTitle = escapeHtml(report.title || report.category)
          const safeAddress = escapeHtml(report.address || report.district_name || 'Kota Semarang')
          const safeTime = escapeHtml(formatRelativeTime(report.created_at))

          popupContent.innerHTML = `
            <div style="min-width: 170px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${colorBg}; font-weight: bold; text-transform: uppercase;">
                  ${safeCode}
                </span>
                <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1); font-family: 'JetBrains Mono', monospace;">
                  ${safeUrgency}
                </span>
              </div>
              <div style="font-weight: bold; font-size: 13px; color: #F8FAFC; margin-bottom: 4px;">
                ${safeTitle}
              </div>
              <div style="color: #94A3B8; font-size: 11px; margin-bottom: 6px;">
                ${safeAddress}
              </div>
              <div style="font-size: 10px; color: #64748B; font-family: 'JetBrains Mono', monospace;">
                ${safeTime}
              </div>
            </div>
          `

          marker.bindPopup(popupContent, { offset: [0, -size / 2], maxWidth: 260, autoPan: true })

          if (onReportClick) {
            marker.on('click', () => onReportClick(report))
          }

          marker.addTo(map as any)
          markersRef.current.push(marker)
        }

        // Heatmap / Influence circle
        if (viewMode === 'heatmap' || viewMode === 'both') {
          const radiusMap = { kritis: 650, tinggi: 450, sedang: 300, rendah: 180 }
          const radius = radiusMap[urgency as keyof typeof radiusMap] || 300

          const circle = L.circle([reportLat, reportLng], {
            radius,
            color: colorBg,
            fillColor: colorBg,
            fillOpacity: 0.18,
            weight: 1,
            dashArray: '2, 4',
          }).addTo(map as any)
          circlesRef.current.push(circle)
        }
      })

      // Render PantauSemar CCTV Markers if showCCTV is true
      if (showCCTV && cctvList.length > 0) {
        cctvList.forEach((cctv) => {
          const cctvSize = 28
          const cctvIcon = L.divIcon({
            className: 'custom-cctv-marker',
            html: `
              <div style="position: relative; width: ${cctvSize}px; height: ${cctvSize}px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #4edea3; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="
                  width: ${cctvSize}px;
                  height: ${cctvSize}px;
                  border-radius: 9999px;
                  background-color: #141c29;
                  border: 2px solid #4edea3;
                  box-shadow: 0 0 12px rgba(78, 222, 163, 0.6);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #4edea3;
                  cursor: pointer;
                  transition: transform 0.15s ease;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [cctvSize, cctvSize],
            iconAnchor: [cctvSize / 2, cctvSize / 2],
          })

          const cctvMarker = L.marker([cctv.latitude, cctv.longitude], { icon: cctvIcon })

          const popupContent = document.createElement('div')
          popupContent.className = 'text-xs'
          const safeCctvCode = escapeHtml(cctv.code)
          const safeCctvName = escapeHtml(cctv.name)
          const safeCctvOpd = escapeHtml(cctv.opd)

          popupContent.innerHTML = `
            <div style="min-width: 170px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4edea3; font-weight: bold;">
                  ${safeCctvCode}
                </span>
                <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: rgba(78, 222, 163, 0.15); color: #4edea3; font-family: 'JetBrains Mono', monospace; font-weight: bold;">
                  TITIK PRIORITAS
                </span>
              </div>
              <div style="font-weight: bold; font-size: 12px; color: #F8FAFC; margin-bottom: 3px;">
                ${safeCctvName}
              </div>
              <div style="color: #94A3B8; font-size: 10px; margin-bottom: 6px;">
                ${safeCctvOpd} • Sumber: PantauSemar
              </div>
              <div style="font-size: 9px; color: #4cd7f6; font-family: 'JetBrains Mono', monospace; font-weight: bold;">
                KLIK UNTUK CEK STREAM REAL-TIME
              </div>
            </div>
          `

          cctvMarker.bindPopup(popupContent, { offset: [0, -cctvSize / 2], maxWidth: 260, autoPan: true })

          if (onCCTVClick) {
            cctvMarker.on('click', () => onCCTVClick(cctv))
          }

          cctvMarker.addTo(map as any)
          cctvMarkersRef.current.push(cctvMarker)
        })
      }

      // Render AI Flood Event Markers (Section 19)
      if (showFloodEvents && floodEvents.length > 0) {
        floodEvents.forEach((ev) => {
          const isConfirmed = ev.status === 'confirmed'
          const floodColor = isConfirmed ? '#ff3366' : '#f59e0b'
          const markerSize = 34

          const floodIcon = L.divIcon({
            className: 'custom-flood-event-marker',
            html: `
              <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; inset: -8px; border-radius: 9999px; background-color: ${floodColor}; opacity: 0.55; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="
                  width: ${markerSize}px;
                  height: ${markerSize}px;
                  border-radius: 9999px;
                  background-color: #160a0f;
                  border: 2px solid ${floodColor};
                  box-shadow: 0 0 16px ${floodColor}aa;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  font-size: 15px;
                  transition: transform 0.15s ease;
                ">
                  🔴
                </div>
              </div>
            `,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
          })

          const floodMarker = L.marker([ev.latitude, ev.longitude], { icon: floodIcon })

          const timeWib = ev.timeline?.[0]?.time_wib || new Date(ev.started_at).toLocaleTimeString('id-ID') + ' WIB'
          const popupContent = document.createElement('div')
          popupContent.className = 'text-xs'
          const safeStatus = escapeHtml(ev.status.toUpperCase())
          const safeDistrict = escapeHtml(ev.district_name)
          const safeCamera = escapeHtml(ev.camera_name)
          const safeTimeWib = escapeHtml(timeWib)
          const safeCategory = escapeHtml(ev.confidence_category)
          const safeSeverity = escapeHtml(ev.estimated_visual_severity)

          popupContent.innerHTML = `
            <div style="min-width: 200px; font-family: inherit;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; color: ${floodColor}; letter-spacing: 0.05em;">
                  🔴 FLOOD EVENT
                </span>
                <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${floodColor}26; color: ${floodColor}; font-family: 'JetBrains Mono', monospace; font-weight: bold;">
                  ${safeStatus}
                </span>
              </div>
              <div style="font-size: 12px; font-weight: bold; color: #F8FAFC; margin-bottom: 4px;">
                Lokasi: <span style="color: #93C5FD;">${safeDistrict}</span>
              </div>
              <div style="color: #94A3B8; font-size: 10px; margin-bottom: 3px;">
                Detected by: <span style="color: #F1F5F9; font-weight: 600;">CCTV PantauSemar (${safeCamera})</span>
              </div>
              <div style="color: #94A3B8; font-size: 10px; margin-bottom: 3px;">
                Started: <span style="color: #F1F5F9; font-weight: 600;">${safeTimeWib}</span>
              </div>
              <div style="color: #94A3B8; font-size: 10px; margin-bottom: 3px;">
                Confidence: <span style="color: #4EDE78; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${(ev.model_confidence * 100).toFixed(0)}%</span> (Overall: ${safeCategory})
              </div>
              <div style="color: #94A3B8; font-size: 10px; margin-bottom: 6px;">
                Severity: <span style="color: #F59E0B; font-weight: 700; text-transform: capitalize;">${safeSeverity}</span>
              </div>
              <div style="font-size: 9px; color: #38BDF8; font-family: 'JetBrains Mono', monospace; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">
                KLIK UNTUK EVIDEN & TIMELINE
              </div>
            </div>
          `

          floodMarker.bindPopup(popupContent, { offset: [0, -markerSize / 2], maxWidth: 280, autoPan: true })

          if (onFloodEventClick) {
            floodMarker.on('click', () => onFloodEventClick(ev))
          }

          floodMarker.addTo(map as any)
          floodMarkersRef.current.push(floodMarker)
        })
      }

      // Render Active SOS Beacons (Critical Emergency Signals)
      if (sosList && sosList.length > 0) {
        sosList.forEach((sos) => {
          const sosSize = 36
          const sosIcon = L.divIcon({
            className: 'custom-sos-marker',
            html: `
              <div style="position: relative; width: ${sosSize}px; height: ${sosSize}px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; inset: -10px; border-radius: 9999px; background-color: #EF4444; opacity: 0.7; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="
                  width: ${sosSize}px;
                  height: ${sosSize}px;
                  border-radius: 9999px;
                  background-color: #CC4117;
                  border: 2px solid #FFFFFF;
                  box-shadow: 0 0 20px #EF4444;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #FFFFFF;
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 14px;
                  font-weight: 900;
                  cursor: pointer;
                ">
                  🚨
                </div>
              </div>
            `,
            iconSize: [sosSize, sosSize],
            iconAnchor: [sosSize / 2, sosSize / 2],
          })

          const marker = L.marker([sos.latitude, sos.longitude], { icon: sosIcon })
          const popupContent = document.createElement('div')
          popupContent.className = 'text-xs'
          popupContent.innerHTML = `
            <div style="min-width: 170px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #EF4444; font-weight: bold;">
                  ${escapeHtml(sos.sos_code)}
                </span>
                <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: #EF4444; color: #FFFFFF; font-weight: bold;">
                  CRITICAL SOS
                </span>
              </div>
              <div style="font-weight: bold; font-size: 12px; color: #1D1D1D; margin-bottom: 2px;">
                Sinyal Darurat 1-Klik Warga
              </div>
              <div style="color: #696969; font-size: 10px;">
                ${escapeHtml(sos.district_name || 'Kota Semarang')}
              </div>
            </div>
          `
          marker.bindPopup(popupContent, { offset: [0, -sosSize / 2] })
          marker.addTo(map as any)
          sosMarkersRef.current.push(marker)
        })
      }

      // Render Incident Clusters (Radius and multi-report badge)
      if (clusters && clusters.length > 0) {
        clusters.forEach((cl) => {
          const circle = L.circle([cl.latitude, cl.longitude], {
            radius: cl.radius_m || 250,
            color: '#4a154b',
            fillColor: '#4a154b',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '4, 4',
          })
          circle.bindPopup(`
            <div style="min-width: 160px; font-size: 11px;">
              <div style="font-weight: bold; color: #4a154b; margin-bottom: 2px;">${escapeHtml(cl.cluster_code)}</div>
              <div style="font-size: 10px; color: #007a5a; font-weight: bold;">👥 ${cl.independent_reporter_count} Pelapor Independen</div>
              <div style="font-size: 10px; color: #696969;">Total Laporan: ${cl.report_count} | Radius ~${cl.radius_m}m</div>
            </div>
          `)
          circle.addTo(map as any)
          clusterLayersRef.current.push(circle)
        })
      }

      // Render Safe Route Polyline & Markers if present
      if (activeSafeRoute && activeSafeRoute.safeWaypoints && activeSafeRoute.safeWaypoints.length >= 2) {
        const polyline = L.polyline(activeSafeRoute.safeWaypoints, {
          color: '#007a5a',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
        })
        polyline.bindPopup(`
          <div style="font-size: 11px; padding: 2px;">
            <div style="font-weight: bold; color: #007a5a;">Jalur Evakuasi Rekomendasi</div>
            <div style="font-weight: bold; color: #1d1d1d; margin: 2px 0;">${escapeHtml(activeSafeRoute.title)}</div>
            <div style="font-size: 10px; color: #696969;">Jarak: ${activeSafeRoute.safeDistanceKm} km (~${activeSafeRoute.estimatedMinutes} Menit)</div>
          </div>
        `)
        polyline.addTo(map as any)
        safeRouteLayersRef.current.push(polyline)

        // Start Pin
        const startIcon = L.divIcon({
          className: 'safe-route-start-pin',
          html: `<div style="background:#cc4117; color:white; font-size:11px; font-weight:bold; border-radius:50%; width:24px; height:24px; display:flex; items-center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); text-align:center; line-height:20px;">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const startMarker = L.marker(activeSafeRoute.originCoords, { icon: startIcon })
        startMarker.bindPopup(`<b>Titik Asal:</b> ${escapeHtml(activeSafeRoute.originName)}`)
        startMarker.addTo(map as any)
        safeRouteLayersRef.current.push(startMarker)

        // Dest Pin
        const endIcon = L.divIcon({
          className: 'safe-route-end-pin',
          html: `<div style="background:#007a5a; color:white; font-size:11px; font-weight:bold; border-radius:50%; width:24px; height:24px; display:flex; items-center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); text-align:center; line-height:20px;">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const endMarker = L.marker(activeSafeRoute.destCoords, { icon: endIcon })
        endMarker.bindPopup(`<b>Tujuan Evakuasi:</b> ${escapeHtml(activeSafeRoute.destName)}`)
        endMarker.addTo(map as any)
        safeRouteLayersRef.current.push(endMarker)

        try {
          ;(map as any).fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 14 })
        } catch {
          // Ignore if map not ready
        }
      }
    }

    updateMarkers()
  }, [reports, sosList, clusters, viewMode, selectedReport, onReportClick, isClient, showCCTV, cctvList, onCCTVClick, floodEvents, showFloodEvents, onFloodEventClick, activeSafeRoute])

  // Center on selected report
  useEffect(() => {
    if (!selectedReport || !leafletMapRef.current) return
    const map = leafletMapRef.current as {
      panTo: (latlng: [number, number], options?: unknown) => void
      getZoom: () => number
      setZoom: (z: number) => void
    }
    const targetLat = selectedReport.latitude ?? selectedReport.lat ?? DEFAULT_CENTER[0]
    const targetLng = selectedReport.longitude ?? selectedReport.lng ?? DEFAULT_CENTER[1]
    map.panTo([targetLat, targetLng], { animate: true })
    if (map.getZoom() < 14) map.setZoom(15)
  }, [selectedReport])

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="relative z-10 focus:outline-none"
    />
  )
}
