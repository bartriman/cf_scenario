import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";

interface UserInfoCardProps {
  email: string;
}

export function UserInfoCard({ email }: UserInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Account Information
        </CardTitle>
        <CardDescription>Your user data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Email</Label>
          <p className="text-lg font-medium">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
