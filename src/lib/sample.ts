import type { ProjectType } from "@/lib/departments";
import { engagementScore, type Interactions } from "@/lib/gauge";

export type SampleProject = {
  id: string;
  title: string;
  summary: string;
  by: string;
  department: string;
  type: ProjectType;
} & Interactions;

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "campuscart",
    title: "CampusCart",
    summary: "A student marketplace for reselling gadgets, notes, and hostel items safely on campus.",
    by: "Peace Akinyemi",
    department: "Computer Science",
    type: "personal",
    views: 650,
    clicks: 180,
    likes: 71,
    comments: 18,
  },
  {
    id: "naijahealth",
    title: "NaijaHealth",
    summary: "A clinic companion that helps students book visits, track symptoms, and keep referral notes organized.",
    by: "Samuel Ojo",
    department: "Public Health",
    type: "gdg-track",
    views: 820,
    clicks: 210,
    likes: 94,
    comments: 27,
  },
  {
    id: "lectureloop",
    title: "LectureLoop",
    summary: "Lecture recap cards and revision prompts generated from class recordings.",
    by: "Damilola Ogunleye",
    department: "Software Engineering",
    type: "gdg-track",
    views: 770,
    clicks: 220,
    likes: 86,
    comments: 21,
  },
  {
    id: "archivista",
    title: "Archivista",
    summary: "A digital exhibition space for student journalism projects and audio documentaries.",
    by: "Joshua Ekanem",
    department: "Mass Communication",
    type: "coursework",
    views: 440,
    clicks: 104,
    likes: 46,
    comments: 12,
  },
  {
    id: "studio-grid",
    title: "Studio Grid",
    summary: "A crit board for architecture submissions with comment layers and version snapshots.",
    by: "Miriam Adebanjo",
    department: "Architecture",
    type: "coursework",
    views: 390,
    clicks: 88,
    likes: 38,
    comments: 9,
  },
  {
    id: "pricepulse",
    title: "PricePulse",
    summary: "A lightweight inflation dashboard tracking grocery price changes around Ilishan and nearby towns.",
    by: "Aanu Kolawole",
    department: "Economics",
    type: "personal",
    views: 510,
    clicks: 130,
    likes: 49,
    comments: 11,
  },
  {
    id: "roomie",
    title: "Roomie",
    summary: "Hostel issue reporting and roommate agreements in one shared workspace.",
    by: "Tobi Fashina",
    department: "Computer Science",
    type: "personal",
    views: 300,
    clicks: 90,
    likes: 35,
    comments: 8,
  },
  {
    id: "careline",
    title: "CareLine",
    summary: "A referral pipeline prototype connecting student volunteers to basic public health interventions.",
    by: "Ada Nwankwo",
    department: "Public Health",
    type: "coursework",
    views: 350,
    clicks: 98,
    likes: 40,
    comments: 10,
  },
  {
    id: "briefly",
    title: "Briefly",
    summary: "AI-assisted script condensing for video explainers and campus social reels.",
    by: "Oluwatobi Faniyi",
    department: "Mass Communication",
    type: "gdg-track",
    views: 470,
    clicks: 140,
    likes: 58,
    comments: 14,
  },
  {
    id: "buildflow",
    title: "BuildFlow",
    summary: "A site planning assistant for estimating materials and documenting field changes.",
    by: "Eniola Adeyinka",
    department: "Architecture",
    type: "gdg-track",
    views: 360,
    clicks: 102,
    likes: 42,
    comments: 13,
  },
];

export const TOP_THREE = [...SAMPLE_PROJECTS]
  .sort((a, b) => engagementScore(b) - engagementScore(a))
  .slice(0, 3);

export const LAST_MONTH_LABEL = "Last month";
export const LAST_MONTH_TOP = TOP_THREE;
