import { strict as assert } from "node:assert";
import { parseSubmissionDraft } from "./submission-draft";

assert.equal(parseSubmissionDraft(null), null);
assert.equal(parseSubmissionDraft("not json"), null);
assert.equal(parseSubmissionDraft('{"version":1,"step":99}'), null);
const draft = {
  version: 1,
  id: "68b749d6-40bb-43e8-8a21-2b27933de68d",
  step: 2,
  title: "My project",
  summary: "A saved summary",
  url: "",
  type: "",
  tags: ["ai"],
  cover: ["https://example.com/cover"],
  media: ["https://example.com/video#video"],
  collaborators: [{ id: "maker", name: "Maker", department: null }],
};
assert.deepEqual(parseSubmissionDraft(JSON.stringify(draft)), draft);
assert.equal(
  parseSubmissionDraft(JSON.stringify({ ...draft, collaborators: [null] })),
  null,
);
assert.equal(
  parseSubmissionDraft(JSON.stringify({ ...draft, media: [123] })),
  null,
);
assert.equal(
  parseSubmissionDraft(JSON.stringify({ ...draft, step: -1 })),
  null,
);
console.log("Submission draft recovery tests passed");
