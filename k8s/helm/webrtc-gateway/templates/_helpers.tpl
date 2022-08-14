{{/*
Expand the name of the chart.
*/}}
{{- define "webrtc-gateway.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "webrtc-gateway.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "webrtc-gateway.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "webrtc-gateway.labels" -}}
helm.sh/chart: {{ include "webrtc-gateway.chart" . }}
{{ include "webrtc-gateway.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "webrtc-gateway.selectorLabels" -}}
app.kubernetes.io/name: {{ include "webrtc-gateway.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "webrtc-gateway.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "webrtc-gateway.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}


{{/*
Define image name
*/}}
{{- define "webrtc-gateway.imageName" -}}
{{- default .Chart.Name .Values.image.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define image tag
*/}}
{{- define "webrtc-gateway.imageTag" -}}
{{- default .Chart.AppVersion .Values.image.tag | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define image URL
*/}}
{{- define "webrtc-gateway.imageURL" -}}
{{- printf "%s/%s:%s" .Values.global.image.registry .Values.global.image.repository (include "webrtc-gateway.imageTag" .) -}}
{{- end -}}

{{/*
original line from mcu shared
{{- printf "%s/%s/%s:%s" .Values.global.image.registry .Values.global.image.repository (include "webrtc-gateway.imageName" .) (include "webrtc-gateway.imageTag" .) -}}
*/}}