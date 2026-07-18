// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useQuery } from '@tanstack/react-query';
// import { resourcesApi } from '../../api/resources.api';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { formatDate } from '../../utils/formatDate';
//
// export function OffboardingPage() {
//   const { data = [], isLoading } = useQuery({ queryKey: ['offboarding'], queryFn: resourcesApi.offboarding });
//   return (
//     <Card>
//       <CardHeader title="Offboarding cases" />
//       {isLoading ? <CardBody>Loading offboarding cases...</CardBody> : (
//         <Table><thead><tr><Th>Worker</Th><Th>Last day</Th><Th>Status</Th><Th>Reason</Th><Th>Notes</Th></tr></thead><tbody>{data.map((item: any) => <tr key={item.id}><Td>{item.worker.firstName} {item.worker.lastName}</Td><Td>{formatDate(item.lastWorkingDay)}</Td><Td><Badge>{item.status}</Badge></Td><Td>{item.reason}</Td><Td>{item.notes}</Td></tr>)}</tbody></Table>
//       )}
//     </Card>
//   );
// }
//