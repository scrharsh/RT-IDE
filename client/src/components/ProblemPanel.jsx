import { useState } from "react";

const initialProblem = {
  title: "",
  description: "",
  constraints: "",
  examples: ""
};

export function ProblemPanel({ onShare, activeProblem }) {
  const [problem, setProblem] = useState(initialProblem);

  return (
    <div className="panel">
      <h3>Share coding problem</h3>
      <input placeholder="Title" value={problem.title} onChange={(e) => setProblem({ ...problem, title: e.target.value })} />
      <textarea placeholder="Description" value={problem.description} onChange={(e) => setProblem({ ...problem, description: e.target.value })} />
      <textarea placeholder="Constraints (newline separated)" value={problem.constraints} onChange={(e) => setProblem({ ...problem, constraints: e.target.value })} />
      <textarea placeholder="Examples (newline separated)" value={problem.examples} onChange={(e) => setProblem({ ...problem, examples: e.target.value })} />
      <button
        onClick={() =>
          onShare({
            ...problem,
            constraints: problem.constraints.split("\n").filter(Boolean),
            examples: problem.examples.split("\n").filter(Boolean)
          })
        }
      >
        Share
      </button>

      {activeProblem?.title ? (
        <div className="problem-preview">
          <h4>{activeProblem.title}</h4>
          <p>{activeProblem.description}</p>
        </div>
      ) : null}
    </div>
  );
}
