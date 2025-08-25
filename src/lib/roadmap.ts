export interface RoadmapTask {
    id: string;
    title: string;
    description?: string;
}

export interface RoadmapPhase {
    title: string;
    subtitle: string;
    tasks: RoadmapTask[];
}

export const roadmapData: RoadmapPhase[] = [
    {
        title: 'Phase 1: Core POS & Cash Management',
        subtitle: 'Months 1-2',
        tasks: [
            { id: 'p1-pos', title: 'Basic POS with cash payments' },
            { id: 'p1-inventory', title: 'Simple inventory tracking' },
            { id: 'p1-tabs', title: 'Customer tab management' },
            { id: 'p1-zout', title: 'Basic Z-out reporting' },
            { id: 'p1-offline', title: 'Core offline functionality' }
        ]
    },
    {
        title: 'Phase 2: Stock Management & Reporting',
        subtitle: 'Months 2-3',
        tasks: [
            { id: 'p2-stock-taking', title: 'Full stock-taking system' },
            { id: 'p2-variance', title: 'Stock variance reporting' },
            { id: 'p2-accounting', title: 'Basic accounting features' },
            { id: 'p2-zout-enhanced', title: 'Enhanced Z-out reports' },
            { id: 'p2-staff', title: 'Simple staff management' }
        ]
    },
    {
        title: 'Phase 3: Debt Management & Polish',
        subtitle: 'Months 3-4',
        tasks: [
            { id: 'p3-debt', title: 'Customer debt tracking' },
            { id: 'p3-reports', title: 'Report improvements' },
            { id: 'p3-hardware', title: 'Hardware integration' },
            { id: 'p3-deploy', title: 'Final testing and deployment' }
        ]
    }
];
