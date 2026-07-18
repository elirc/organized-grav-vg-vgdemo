// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useQuery } from '@tanstack/react-query';
// import { resourcesApi } from '../../api/resources.api';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Table, Td, Th } from '../../components/ui/Table';
//
// export function CountryRulesPage() {
//   const { data = [], isLoading } = useQuery({ queryKey: ['country-rules'], queryFn: resourcesApi.countryRules });
//   return (
//     <div className="grid gap-4">
//       <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Country rules are simplified demo data and are not legal, payroll, or tax advice.</p>
//       <Card>
//         <CardHeader title="Country rule templates" />
//         {isLoading ? <CardBody>Loading country rules...</CardBody> : (
//           <Table><thead><tr><Th>Country</Th><Th>Currency</Th><Th>Vacation</Th><Th>Notice</Th><Th>Employer cost</Th><Th>Employee tax</Th></tr></thead><tbody>{data.map((rule: any) => <tr key={rule.id}><Td>{rule.countryName}</Td><Td>{rule.currency}</Td><Td>{rule.statutoryVacationDays} days</Td><Td>{rule.noticePeriodDays} days</Td><Td>{Math.round(rule.employerCostPercent * 100)}%</Td><Td>{Math.round(rule.employeeTaxPercent * 100)}%</Td></tr>)}</tbody></Table>
//         )}
//       </Card>
//     </div>
//   );
// }
//