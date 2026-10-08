export const DEPARTMENTS = [
  "Accounting",
  "Adult Health",
  "Agriculture and Industrial Technology",
  "Anatomy",
  "Architecture",
  "Basic Sciences",
  "Biochemistry",
  "Business Administration and Marketing",
  "Chemical Pathology",
  "Civil Engineering",
  "Community Health",
  "Community Medicine",
  "Computer Engineering",
  "Computer Science",
  "Economics",
  "Education",
  "Electrical Engineering",
  "Estate Management",
  "Finance",
  "Haematology and Immunology",
  "Histopathology",
  "History and International Studies",
  "Human Nutrition and Dietetics",
  "Information Resources Management",
  "Information Technology",
  "Internal Medicine",
  "International Law and Security Studies",
  "Jurisprudence and Public Law",
  "Languages and Literary Studies",
  "Mass Communication",
  "Maternal and Child Health",
  "Mechanical Engineering",
  "Medical Laboratory Science",
  "Medical Microbiology",
  "Microbiology",
  "Music and Creative Arts",
  "Obstetrics and Gynaecology",
  "Paediatrics",
  "Pharmacology and Therapeutics",
  "Physiology",
  "Political Science and Public Administration",
  "Private and Commercial Law",
  "Psychiatry and Mental Health",
  "Public Health",
  "Religious Studies",
  "Social Work",
  "Software Engineering",
  "Surgery"
] as const;

export const LEVELS = ["100", "200", "300", "400", "500", "600"] as const;

export const PROJECT_TYPES = ["coursework", "gdg-track", "personal"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_LABEL: Record<ProjectType, string> = {
  "coursework": "Course Work",
  "gdg-track": "GDG Track",
  "personal": "Personal",
};
