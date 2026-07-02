import { http, HttpResponse } from 'msw';

const BASE = '/api/v1';

const mockScenarioRuns = [
  {
    scenarioRunName: 'pod-disruption-run-01',
    scenarioName: 'pod-disruption',
    phase: 'Succeeded',
    totalTargets: 2,
    successfulJobs: 2,
    failedJobs: 0,
    runningJobs: 0,
    clusterJobs: [
      {
        providerName: 'aws',
        clusterName: 'staging-us-east-1',
        jobId: 'job-abc-001',
        podName: 'krkn-pod-disruption-abc',
        phase: 'Succeeded',
        startTime: '2026-07-02T10:00:00Z',
        completionTime: '2026-07-02T10:05:30Z',
        containerImage: 'quay.io/krkn-chaos/krkn-hub:latest',
      },
      {
        providerName: 'aws',
        clusterName: 'staging-eu-west-1',
        jobId: 'job-abc-002',
        podName: 'krkn-pod-disruption-def',
        phase: 'Succeeded',
        startTime: '2026-07-02T10:00:00Z',
        completionTime: '2026-07-02T10:04:45Z',
        containerImage: 'quay.io/krkn-chaos/krkn-hub:latest',
      },
    ],
    createdAt: '2026-07-02T10:00:00Z',
    ownerUserId: 'admin@preview.local',
    registryName: 'default',
  },
  {
    scenarioRunName: 'node-cpu-hog-run-02',
    scenarioName: 'node-cpu-hog',
    phase: 'Failed',
    totalTargets: 1,
    successfulJobs: 0,
    failedJobs: 1,
    runningJobs: 0,
    clusterJobs: [
      {
        providerName: 'gcp',
        clusterName: 'prod-us-central1',
        jobId: 'job-def-001',
        podName: 'krkn-node-cpu-hog-ghi',
        phase: 'Failed',
        startTime: '2026-07-02T09:30:00Z',
        completionTime: '2026-07-02T09:32:10Z',
        message: 'OOMKilled',
        containerImage: 'quay.io/krkn-chaos/krkn-hub:latest',
      },
    ],
    createdAt: '2026-07-02T09:30:00Z',
    ownerUserId: 'admin@preview.local',
    registryName: 'default',
  },
  {
    scenarioRunName: 'network-chaos-run-03',
    scenarioName: 'network-chaos',
    phase: 'Running',
    totalTargets: 1,
    successfulJobs: 0,
    failedJobs: 0,
    runningJobs: 1,
    clusterJobs: [
      {
        providerName: 'aws',
        clusterName: 'staging-us-east-1',
        jobId: 'job-ghi-001',
        podName: 'krkn-network-chaos-jkl',
        phase: 'Running',
        startTime: '2026-07-02T10:10:00Z',
        containerImage: 'quay.io/krkn-chaos/krkn-hub:latest',
      },
    ],
    createdAt: '2026-07-02T10:10:00Z',
    ownerUserId: 'admin@preview.local',
    registryName: 'default',
  },
];

const mockGraphRuns = [
  {
    name: 'chaos-workflow-daily',
    namespace: 'krkn-operator-system',
    creationTimestamp: '2026-07-02T08:00:00Z',
    phase: 'Completed',
    ownerUserId: 'admin@preview.local',
    targetRequestId: 'target-001',
    summary: {
      totalNodes: 4,
      completedNodes: 4,
      runningNodes: 0,
      failedNodes: 0,
      pendingNodes: 0,
    },
    startTime: '2026-07-02T08:00:00Z',
    completionTime: '2026-07-02T08:25:00Z',
  },
  {
    name: 'resilience-test-staging',
    namespace: 'krkn-operator-system',
    creationTimestamp: '2026-07-02T10:05:00Z',
    phase: 'Running',
    ownerUserId: 'admin@preview.local',
    targetRequestId: 'target-002',
    summary: {
      totalNodes: 3,
      completedNodes: 1,
      runningNodes: 1,
      failedNodes: 0,
      pendingNodes: 1,
    },
    startTime: '2026-07-02T10:05:00Z',
  },
];

export const handlers = [
  // Auth
  http.get(`${BASE}/auth/is-registered`, () =>
    HttpResponse.json({ registered: true }),
  ),

  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      token: 'mock-preview-jwt-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      userId: 'admin@preview.local',
      role: 'admin',
      name: 'Preview',
      surname: 'User',
      organization: 'Krkn',
    }),
  ),

  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({
      message: 'User registered successfully',
      userId: 'admin@preview.local',
      role: 'admin',
    }),
  ),

  // Scenario runs (polled)
  http.get(`${BASE}/scenarios/run`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.pathname.split('/').pop();
    if (name && name !== 'run') {
      const run = mockScenarioRuns.find((r) => r.scenarioRunName === name);
      return run ? HttpResponse.json(run) : new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ scenarioRuns: mockScenarioRuns });
  }),

  http.get(`${BASE}/scenarios/run/:scenarioRunName`, ({ params }) => {
    const run = mockScenarioRuns.find(
      (r) => r.scenarioRunName === params.scenarioRunName,
    );
    return run ? HttpResponse.json(run) : new HttpResponse(null, { status: 404 });
  }),

  // Graph runs (polled)
  http.get(`${BASE}/graphruns`, () => HttpResponse.json(mockGraphRuns)),

  http.get(`${BASE}/graphruns/:name`, ({ params }) => {
    const run = mockGraphRuns.find((r) => r.name === params.name);
    return run ? HttpResponse.json(run) : new HttpResponse(null, { status: 404 });
  }),

  // Dashboard
  http.get(`${BASE}/dashboard/active-runs`, () =>
    HttpResponse.json({
      totalActiveRuns: 2,
      totalClusters: 3,
      clusterRuns: {
        'staging-us-east-1': ['network-chaos-run-03'],
        'prod-us-central1': [],
        'staging-eu-west-1': [],
      },
    }),
  ),

  // Targets
  http.get(`${BASE}/operator/targets`, () =>
    HttpResponse.json({
      targets: [
        {
          uuid: 'target-001',
          name: 'staging-targets',
          status: 'ready',
          clusters: ['staging-us-east-1', 'staging-eu-west-1'],
          createdAt: '2026-07-01T12:00:00Z',
        },
        {
          uuid: 'target-002',
          name: 'prod-targets',
          status: 'ready',
          clusters: ['prod-us-central1'],
          createdAt: '2026-06-30T08:00:00Z',
        },
      ],
    }),
  ),

  // Clusters
  http.get(`${BASE}/clusters`, () =>
    HttpResponse.json({
      targetData: {
        'krkn-operator': [
          { 'cluster-name': 'staging-us-east-1', 'cluster-api-url': 'https://api.staging-east.example.com:6443' },
          { 'cluster-name': 'staging-eu-west-1', 'cluster-api-url': 'https://api.staging-west.example.com:6443' },
          { 'cluster-name': 'prod-us-central1', 'cluster-api-url': 'https://api.prod.example.com:6443' },
        ],
      },
      status: 'ready',
    }),
  ),

  // Registries
  http.get(`${BASE}/registries`, () =>
    HttpResponse.json({
      registries: [
        {
          name: 'default',
          url: 'quay.io/krkn-chaos',
          description: 'Default krkn scenario registry',
          createdAt: '2026-06-01T00:00:00Z',
        },
      ],
    }),
  ),

  http.get(`${BASE}/registries/available`, () =>
    HttpResponse.json({
      registries: [
        { name: 'default', url: 'quay.io/krkn-chaos', description: 'Default krkn scenario registry' },
      ],
    }),
  ),

  // Scenarios
  http.post(`${BASE}/scenarios`, () =>
    HttpResponse.json({
      scenarios: [
        { name: 'pod-disruption', description: 'Disrupts pods in target namespaces' },
        { name: 'node-cpu-hog', description: 'Stresses CPU on target nodes' },
        { name: 'network-chaos', description: 'Introduces network latency and packet loss' },
        { name: 'container-kill', description: 'Kills containers in target pods' },
        { name: 'time-skew', description: 'Skews system time on target nodes' },
      ],
    }),
  ),

  // Users
  http.get(`${BASE}/users`, () =>
    HttpResponse.json({
      users: [
        {
          userId: 'admin@preview.local',
          name: 'Preview',
          surname: 'User',
          role: 'admin',
          organization: 'Krkn',
          createdAt: '2026-06-01T00:00:00Z',
        },
      ],
    }),
  ),

  // Groups
  http.get(`${BASE}/groups`, () =>
    HttpResponse.json({
      groups: [
        {
          name: 'chaos-engineers',
          description: 'Chaos engineering team',
          createdAt: '2026-06-01T00:00:00Z',
          memberCount: 1,
        },
      ],
    }),
  ),

  // Providers
  http.get(`${BASE}/providers`, () =>
    HttpResponse.json({
      providers: [
        { name: 'aws', active: true, description: 'Amazon Web Services' },
        { name: 'gcp', active: true, description: 'Google Cloud Platform' },
        { name: 'azure', active: false, description: 'Microsoft Azure' },
      ],
    }),
  ),

  // Files
  http.get(`${BASE}/files`, () => HttpResponse.json({ files: [] })),
  http.get(`${BASE}/files/available`, () => HttpResponse.json({ files: [] })),
  http.get(`${BASE}/file-types`, () => HttpResponse.json({ fileTypes: [] })),

  // Terminal
  http.get(`${BASE}/terminal/available-commands`, () =>
    HttpResponse.json({
      commands: [
        {
          name: 'oc',
          description: 'OpenShift CLI',
          subcommands: [
            { name: 'get', description: 'Display resources' },
            { name: 'describe', description: 'Show details of a resource' },
          ],
        },
      ],
    }),
  ),

  // Catch-all for unhandled API calls — return empty success
  http.all(`${BASE}/*`, ({ request }) => {
    const method = request.method;
    if (method === 'GET') return HttpResponse.json({});
    if (method === 'DELETE') return new HttpResponse(null, { status: 204 });
    return HttpResponse.json({ success: true });
  }),
];
