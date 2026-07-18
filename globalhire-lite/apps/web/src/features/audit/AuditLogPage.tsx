// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useQuery } from '@tanstack/react-query';
// import { resourcesApi } from '../../api/resources.api';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { formatDate } from '../../utils/formatDate';
//
// export function AuditLogPage() {
//   const { data = [], isLoading } = useQuery({ queryKey: ['audit-log'], queryFn: resourcesApi.audit });
//   return (
//     <Card>
//       <CardHeader title="Audit log" />
//       {isLoading ? <CardBody>Loading audit log...</CardBody> : (
//         <Table><thead><tr><Th>When</Th><Th>Action</Th><Th>Entity</Th><Th>Message</Th><Th>Actor</Th></tr></thead><tbody>{data.map((log: any) => <tr key={log.id}><Td>{formatDate(log.createdAt)}</Td><Td>{log.action}</Td><Td>{log.entityType}</Td><Td>{log.message}</Td><Td>{log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : 'System'}</Td></tr>)}</tbody></Table>
//       )}
//     </Card>
//   );
// }
//