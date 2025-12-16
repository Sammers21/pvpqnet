import axios from 'axios';

import { BRACKETS } from '@/constants/pvp-activity';
import { REGION } from '@/constants/region';

import { baseUrl, urls } from '@/config';
import type { EquippedItem, Meta, Player } from '@/types';

export const statsMap = {
  [REGION.us]: 'en-us',
  [REGION.eu]: 'en-gb',
};


export const getProfile = async (region: string, realm: string, name: string, update: boolean = false) => {
  const url = baseUrl + `/api/${region}/${realm}/${name}${update ? "/update" : ""}`;
  const response = await axios.get(url, {
    validateStatus: (status) => status < 500,
    headers: {
      "Accept-Encoding": "gzip",
    },
  });
  const data = response.data as Player;
  return { playerStatus: response.status, player: data };
}

// Fetch gem icon from Wowhead
const fetchGemIcon = async (gemId: number): Promise<string | undefined> => {
  try {
    const url = `https://nether.wowhead.com/tooltip/item/${gemId}?dataEnv=1&locale=0`;
    const response = await axios.get(url, { timeout: 3000 });
    const iconName = response.data?.icon;
    return iconName
      ? `https://wow.zamimg.com/images/wow/icons/medium/${iconName}.jpg`
      : undefined;
  } catch {
    return undefined;
  }
};

export const getEquipment = async (region: string, realm: string, name: string): Promise<EquippedItem[]> => {
  const url = baseUrl + `/api/${region}/${realm}/${name}/equipment`;
  try {
    const response = await axios.get(url, {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });
    const items = response.data.equipment as EquippedItem[];
    // Fetch Wowhead tooltip and icon data for each item in parallel
    const itemsWithData = await Promise.all(
      items.map(async (item) => {
        try {
          const { tooltip, icon } = await fetchWowheadData(item);
          // Also fetch gem icons for sockets
          const socketsWithIcons = await Promise.all(
            (item.sockets || []).map(async (socket) => {
              if (socket.gemId) {
                const gemIcon = await fetchGemIcon(socket.gemId);
                return { ...socket, icon: gemIcon };
              }
              return socket;
            })
          );
          return { ...item, tooltip, icon, sockets: socketsWithIcons };
        } catch {
          return item;
        }
      })
    );
    return itemsWithData;
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return [];
  }
}

export const getTalents = async (region: string, realm: string, name: string): Promise<any> => {
  const url = baseUrl + `/api/${region}/${realm}/${name}/talents`;
  try {
    const response = await axios.get(url, {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch talents:', error);
    return null;
  }
}

// Fetch tooltip and icon from Wowhead's nether API
const fetchWowheadData = async (item: EquippedItem): Promise<{ tooltip?: string; icon?: string }> => {
  try {
    // Build Wowhead URL with bonus IDs, gems, and enchants
    let wowheadUrl = `https://nether.wowhead.com/tooltip/item/${item.itemId}?dataEnv=1&locale=0`;
    if (item.bonusList?.length > 0) {
      wowheadUrl += `&bonus=${item.bonusList.join(':')}`;
    }
    const gemIds = item.sockets
      ?.filter((s) => s.gemId)
      .map((s) => s.gemId)
      .filter(Boolean);
    if (gemIds?.length > 0) {
      wowheadUrl += `&gems=${gemIds.join(':')}`;
    }
    if (item.enchantments?.length > 0) {
      wowheadUrl += `&ench=${item.enchantments[0].enchantmentId}`;
    }
    const response = await axios.get(wowheadUrl, {
      timeout: 5000,
    });
    const tooltip = response.data?.tooltip;
    const iconName = response.data?.icon;
    const icon = iconName
      ? `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`
      : undefined;
    return { tooltip, icon };
  } catch {
    return {};
  }
}

// Fetch spell tooltip HTML from Wowhead and extract the first image src as icon
export const fetchSpellIcon = async (spellId: number): Promise<string | undefined> => {
  try {
    const url = `https://nether.wowhead.com/tooltip/spell/${spellId}?dataEnv=1&locale=0`;
    const response = await axios.get(url, { timeout: 5000 });
    const tooltipHtml = response.data?.tooltip as string | undefined;
    if (!tooltipHtml) return undefined;
    const match = tooltipHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) {
      return match[1].replace('/medium/', '/large/');
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}

export const getLadder = async ({
  page = 1,
  region = REGION.eu,
  activity = 'activity',
  bracket = BRACKETS.shuffle,
  specs = [],
}) => {
  try {
    const response = await axios.get(
      urls.getLadderData(page, statsMap[region], activity, bracket, specs), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }
    );

    const data = response.data;
    return {
      records: data?.characters ?? [],
      totalPages: data?.total_pages ?? 0,
      timestamp: data?.timestamp,
    };
  } catch (error) {
    return { records: [], totalPages: 0 };
  }
};

export async function getMulticlasserLeaderboard(region: REGION, role: string = 'all', page = 1) {
  try {
    const response = await axios.get(urls.getMulticlasserLeaderboard(statsMap[region]), {
      params: {
        role: role,
        page: page,
      },
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function fetchBracketActivity(region: REGION) {
  try {
    const response = await axios.get(urls.getStatistic(statsMap[region]), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return { '2v2': 0, '3v3': 0, rbg: 0, shuffle: 0 };
  }
}

export async function searchPlayers(search: string) {
  try {
    const response = await axios.get(urls.searchPlayers(search), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function getMeta(params: Record<string, string>): Promise<Meta> {
  const response = await axios.get(urls.currentMeta, Object.assign({}, { params }, {
    headers: {
      'Accept-Encoding': 'gzip',
    },
  }
  ));
  return response.data;
}
