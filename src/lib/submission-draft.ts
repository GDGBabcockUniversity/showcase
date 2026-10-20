// Browser recovery only; every field is still validated by the server on submit.
export type SubmissionDraft = {
  version: 1;
  id: string;
  step: number;
  title: string;
  summary: string;
  url: string;
  type: string;
  tags: string[];
  cover: string[];
  media: string[];
  collaborators: { id: string; name: string; department: string | null }[];
};

export function parseSubmissionDraft(
  raw: string | null,
): SubmissionDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const strings = (value: unknown) =>
      Array.isArray(value) && value.every((v) => typeof v === "string");
    if (
      !d ||
      d.version !== 1 ||
      typeof d.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        d.id,
      ) ||
      !Number.isInteger(d.step) ||
      d.step < 0 ||
      d.step > 3 ||
      ![d.title, d.summary, d.url, d.type].every(
        (v) => typeof v === "string",
      ) ||
      ![d.tags, d.cover, d.media].every(strings) ||
      !Array.isArray(d.collaborators) ||
      !d.collaborators.every(
        (v: unknown) =>
          v !== null &&
          typeof v === "object" &&
          "id" in v &&
          typeof v.id === "string" &&
          "name" in v &&
          typeof v.name === "string" &&
          "department" in v &&
          (v.department === null || typeof v.department === "string"),
      )
    )
      return null;
    return d;
  } catch {
    return null;
  }
}
