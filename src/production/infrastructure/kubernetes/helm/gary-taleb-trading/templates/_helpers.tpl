{{/*
Expand the name of the chart.
*/}}
{{- define "gary-taleb-trading.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "gary-taleb-trading.fullname" -}}
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
{{- define "gary-taleb-trading.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "gary-taleb-trading.labels" -}}
helm.sh/chart: {{ include "gary-taleb-trading.chart" . }}
{{ include "gary-taleb-trading.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: gary-taleb-trading-system
environment: {{ .Values.global.environment }}
compliance.level: defense-industry
security.level: high
{{- end }}

{{/*
Selector labels
*/}}
{{- define "gary-taleb-trading.selectorLabels" -}}
app.kubernetes.io/name: {{ include "gary-taleb-trading.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "gary-taleb-trading.serviceAccountName" -}}
{{- if .Values.security.serviceAccount.create }}
{{- default (include "gary-taleb-trading.fullname" .) .Values.security.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.security.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate certificates for TLS
*/}}
{{- define "gary-taleb-trading.gen-certs" -}}
{{- $altNames := list ( printf "%s.%s" (include "gary-taleb-trading.name" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "gary-taleb-trading.name" .) .Release.Namespace ) -}}
{{- $ca := genCA "gary-taleb-trading-ca" 365 -}}
{{- $cert := genSignedCert ( include "gary-taleb-trading.name" . ) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
ca.crt: {{ $ca.Cert | b64enc }}
{{- end }}

{{/*
Database connection string
*/}}
{{- define "gary-taleb-trading.database.connectionString" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s:%d/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "gary-taleb-trading.fullname" .) .Values.postgresql.service.port .Values.postgresql.auth.database }}
{{- else }}
{{- printf "postgresql://%s:%s@%s:%d/%s" "trading_admin" "$(DB_PASSWORD)" .Values.postgresql.external.host .Values.postgresql.external.port .Values.postgresql.external.database }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "gary-taleb-trading.redis.connectionString" -}}
{{- if .Values.redis.enabled }}
{{- printf "redis://%s:%d" (include "gary-taleb-trading.fullname" .) .Values.redis.service.port }}
{{- else }}
{{- printf "redis://:%s@%s:%d" "$(REDIS_AUTH_TOKEN)" .Values.redis.external.host .Values.redis.external.port }}
{{- end }}
{{- end }}

{{/*
Common environment variables
*/}}
{{- define "gary-taleb-trading.commonEnv" -}}
- name: NODE_ENV
  value: {{ .Values.global.environment | quote }}
- name: LOG_LEVEL
  value: {{ .Values.logging.level | quote }}
- name: LOG_FORMAT
  value: {{ .Values.logging.format | quote }}
- name: DATABASE_URL
  value: {{ include "gary-taleb-trading.database.connectionString" . | quote }}
- name: REDIS_URL
  value: {{ include "gary-taleb-trading.redis.connectionString" . | quote }}
- name: METRICS_PORT
  value: "9090"
- name: HEALTH_PORT
  value: "8081"
- name: COMPLIANCE_MODE
  value: {{ .Values.compliance.auditLogging | ternary "defense-industry" "standard" | quote }}
{{- end }}

{{/*
Security context for trading applications
*/}}
{{- define "gary-taleb-trading.securityContext" -}}
runAsNonRoot: true
runAsUser: 1000
runAsGroup: 1000
fsGroup: 1000
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{/*
Pod anti-affinity rules
*/}}
{{- define "gary-taleb-trading.podAntiAffinity" -}}
preferredDuringSchedulingIgnoredDuringExecution:
- weight: 100
  podAffinityTerm:
    labelSelector:
      matchExpressions:
      - key: app.kubernetes.io/name
        operator: In
        values:
        - {{ include "gary-taleb-trading.name" . }}
      - key: app.kubernetes.io/component
        operator: In
        values:
        - {{ .component }}
    topologyKey: kubernetes.io/hostname
{{- end }}

{{/*
Resource limits based on environment
*/}}
{{- define "gary-taleb-trading.resources" -}}
{{- $env := .Values.global.environment -}}
{{- if eq $env "production" }}
{{- toYaml .Values.environments.production.resources }}
{{- else if eq $env "staging" }}
{{- toYaml .Values.environments.staging.resources }}
{{- else }}
{{- toYaml .Values.tradingApp.resources }}
{{- end }}
{{- end }}

{{/*
Monitoring annotations
*/}}
{{- define "gary-taleb-trading.monitoringAnnotations" -}}
prometheus.io/scrape: "true"
prometheus.io/port: "9090"
prometheus.io/path: "/metrics"
{{- end }}

{{/*
Fluent Bit configuration
*/}}
{{- define "gary-taleb-trading.fluentBitConfig" -}}
[SERVICE]
    Flush         1
    Log_Level     info
    Daemon        off
    Parsers_File  parsers.conf
    HTTP_Server   On
    HTTP_Listen   0.0.0.0
    HTTP_Port     2020

[INPUT]
    Name              tail
    Path              /app/logs/*.log
    Parser            json
    Tag               trading.*
    Refresh_Interval  5

[OUTPUT]
    Name                cloudwatch_logs
    Match               trading.*
    region              us-east-1
    log_group_name      /aws/eks/gary-taleb-trading
    log_stream_prefix   {{ .Release.Name }}-
    auto_create_group   true
{{- end }}