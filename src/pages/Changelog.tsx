import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TrendingUp, Bug, Shield } from "lucide-react";
import { changelogData, ChangelogEntry } from "@/data/changelog";
import { SEO } from "@/components/SEO";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const getCategoryConfig = (category: ChangelogEntry['category']) => {
  const configs = {
    feature: {
      icon: Sparkles,
      label: "Nouvelle fonctionnalité",
      variant: "default" as const,
      color: "text-primary"
    },
    improvement: {
      icon: TrendingUp,
      label: "Amélioration",
      variant: "secondary" as const,
      color: "text-green-600 dark:text-green-400"
    },
    bugfix: {
      icon: Bug,
      label: "Correction de bug",
      variant: "outline" as const,
      color: "text-orange-600 dark:text-orange-400"
    },
    security: {
      icon: Shield,
      label: "Sécurité",
      variant: "destructive" as const,
      color: "text-destructive"
    }
  };
  return configs[category];
};

const Changelog = () => {
  const sortedChangelog = [...changelogData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestUpdate = sortedChangelog[0]?.date;

  return (
    <>
      <SEO 
        title="Changelog - Historique des évolutions"
        description="Découvrez toutes les évolutions, nouvelles fonctionnalités et améliorations de Feeds.Duhaz.fr. Historique complet des mises à jour."
        keywords="changelog, mises à jour, évolutions, nouveautés, historique, versions"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Changelog</h1>
                <p className="text-muted-foreground">
                  Historique des évolutions du site
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{sortedChangelog.length} versions</span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                Dernière mise à jour : {latestUpdate && format(parseISO(latestUpdate), "d MMMM yyyy", { locale: fr })}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-6">
              {sortedChangelog.map((entry, index) => {
                const config = getCategoryConfig(entry.category);
                const Icon = config.icon;
                
                return (
                  <div key={`${entry.version}-${entry.date}`}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-card border flex items-center justify-center ${config.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-xl">
                                  {entry.title}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={config.variant} className="gap-1">
                                  <Icon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                                <Badge variant="outline">v{entry.version}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(entry.date), "d MMMM yyyy", { locale: fr })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-3">
                          {entry.description}
                        </CardDescription>
                      </CardHeader>
                      
                      {entry.details && entry.details.length > 0 && (
                        <CardContent>
                          <ul className="space-y-2">
                            {entry.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-muted-foreground">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      )}
                    </Card>
                    
                    {index < sortedChangelog.length - 1 && (
                      <div className="flex justify-center my-4">
                        <Separator className="w-[2px] h-6" orientation="vertical" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default Changelog;
