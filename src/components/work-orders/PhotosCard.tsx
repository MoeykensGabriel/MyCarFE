import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoType, PhotoTypeLabel } from "@/lib/enums";
import { WorkOrderPhoto } from "@/types/api.types";

interface PhotosCardProps {
  photos: WorkOrderPhoto[];
}

export function PhotosCard({ photos }: PhotosCardProps) {
  const before = photos.filter((p) => Number(p.photoType) === PhotoType.Before);
  const after = photos.filter((p) => Number(p.photoType) === PhotoType.After);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fotos</CardTitle>
      </CardHeader>
      <CardContent>
        {!photos.length ? (
          <p className="text-sm text-muted-foreground">Sin fotos registradas.</p>
        ) : (
          <div className="space-y-4">
            {[
              { label: PhotoTypeLabel[PhotoType.Before], items: before },
              { label: PhotoTypeLabel[PhotoType.After], items: after },
            ].map(({ label, items }) =>
              items.length > 0 ? (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={label}
                          className="h-24 w-24 object-cover rounded-md border hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
