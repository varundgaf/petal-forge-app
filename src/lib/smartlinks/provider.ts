export type NetworkPlacement = {
  id: string;
  title: string;
  url: string;
};

export type NetworkStat = {
  date: string;
  placementId: string;
  placementSubId: string;
  country: string;
  device: string;
  referrer: string;
  impressions: number;
  clicks: number;
  revenue: number;
};

export interface SmartLinkProvider {
  readonly key: string;
  listPlacements(): Promise<NetworkPlacement[]>;
  getStats(input: { from: string; to: string }): Promise<NetworkStat[]>;
  buildRedirectUrl(destinationUrl: string, placementSubId: string): URL;
}