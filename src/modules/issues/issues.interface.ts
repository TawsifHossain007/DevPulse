export interface IIssues {
    title: string;
    description: string;
    status?: 'in_progress' | 'open' | 'resolved';
    type: 'bug' | 'feature_request';
    user_id: number;
}