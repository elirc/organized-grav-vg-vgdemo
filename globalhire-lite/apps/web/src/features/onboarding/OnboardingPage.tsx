// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useQuery } from '@tanstack/react-query';
// import { useParams } from 'react-router-dom';
// import { workersApi } from '../../api/workers.api';
// import { Card, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
//
// export function OnboardingPage() {
//   const { id = '' } = useParams();
//   const { data = [], isLoading } = useQuery({ queryKey: ['worker-onboarding', id], queryFn: () => workersApi.onboarding(id) });
//   return (
//     <Card>
//       <CardHeader title="Onboarding tasks" />
//       {isLoading ? <p className="p-5">Loading onboarding...</p> : (
//         <Table>
//           <thead><tr><Th>Task</Th><Th>Description</Th><Th>Required</Th><Th>Status</Th></tr></thead>
//           <tbody>{data.map((task: any) => <tr key={task.id}><Td className="font-medium">{task.title}</Td><Td>{task.description}</Td><Td>{task.required ? 'Yes' : 'No'}</Td><Td><Badge>{task.status}</Badge></Td></tr>)}</tbody>
//         </Table>
//       )}
//     </Card>
//   );
// }
//