import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

/** Mantiene los índices del detector y la asignación de modelos en una sola fuente. */
export async function writeTargetMap(root, manifest, compiled) {
  manifest ??= JSON.parse(await readFile(join(root, 'design/targets/targets.json'), 'utf8'));
  compiled ??= await readFile(join(root, 'src/assets/targets/targets.mind'));
  const version = createHash('sha256').update(compiled).digest('hex').slice(0, 12);
  const mapping = manifest.map((target, index) => ({ index, teamId: target.team }));
  await writeFile(
    join(root, 'src/app/data/targets.ts'),
    `/** Generado por npm run targets / models:import. No editar los índices a mano. */
import importedModels from '../../assets/models/imported/catalog.json' with { type: 'json' };

export const TARGETS_SRC = 'assets/targets/targets.mind?v=${version}';

export interface TeamModel {
  id: string;
  label: string;
  src: string;
  placeholder: boolean;
}

export function modelForTeam(teamId: string): TeamModel {
  const model = importedModels.models.find((entry) => entry.teams.includes(teamId));
  return model
    ? { id: model.id, label: model.label, src: model.src, placeholder: false }
    : { id: 'cube-' + teamId, label: 'Modelo provisional', src: 'assets/models/cube-' + teamId + '.glb', placeholder: true };
}

export interface ArTarget {
  index: number;
  teamId: string;
  model: string;
}

export const AR_TARGETS: ArTarget[] = ${JSON.stringify(mapping, null, 2)}.map((target) => ({
  ...target, model: modelForTeam(target.teamId).src,
}));
`,
  );
}
