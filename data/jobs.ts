// NO SAMPLE DATA. The example listings that previously lived here were removed
// at the client's request (Day 16): they appeared on the public site labelled
// "Example listing", and the client does not want demo content visible.
//
// DO NOT ADD PLACEHOLDER JOBS HERE. Real listings arrive from the approved CMS
// through lib/jobs.ts. A record in this file with no moderation status is now
// rejected by the publication gate (JOBS_ARE_SAMPLE_DATA is false), so adding
// one would not publish it anyway.
export type Job={slug:string;title:string;organization:string;location:string;type:string;category:string;pay:string;posted:string;summary:string;responsibilities:string[];qualifications:string[]};
export const jobs:Job[]=[];
