import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  base_currency: string;
  role: string;
}

interface CompanyListCardProps {
  companies: Company[];
}

export function CompanyListCard({ companies }: CompanyListCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          My Companies
        </CardTitle>
        <CardDescription>Companies you have access to</CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">You are not associated with any company</p>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.base_currency} • {company.role}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/scenarios">Go to scenarios</a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
