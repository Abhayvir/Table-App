import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';

interface ArtworkItem {
  id: string;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number;
  date_end: number;
}

interface APIResponse {
  data: ArtworkItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const BASE_API_URL = 'https://api.artic.edu/api/v1/artworks';
const FIELDS = 'id,title,place_of_origin,artist_display,inscriptions,date_start,date_end';
const ROWS_PER_PAGE = 12;

const DataTablePage: React.FC = () => {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedArtworks, setSelectedArtworks] = useState<ArtworkItem[]>([]);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: ROWS_PER_PAGE,
    page: 1,
  });
  const [customRowCount, setCustomRowCount] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    fetchData(lazyState.page);
  }, [lazyState]);

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const API_URL = `${BASE_API_URL}?page=${page}&limit=${ROWS_PER_PAGE}&fields=${FIELDS}`;
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result: APIResponse = await response.json();
      setArtworks(result.data);
      setTotalRecords(result.pagination.total);
      return result.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const onPage = (event: any) => {
    setLazyState({
      first: event.first,
      page: event.page + 1,
      rows: event.rows,
    });
  };

  const selectRows = async (count: number) => {
    let remainingCount = count;
    let currentPage = lazyState.page;
    let selectedItems: ArtworkItem[] = [];

    while (remainingCount > 0) {
      let pageData = currentPage === lazyState.page ? artworks : await fetchData(currentPage);
      const itemsToSelect = pageData.slice(0, remainingCount);
      selectedItems = [...selectedItems, ...itemsToSelect];
      remainingCount -= itemsToSelect.length;
      currentPage++;
    }

    setSelectedArtworks(selectedItems);
    if (currentPage > lazyState.page) {
      setLazyState(prev => ({...prev, page: currentPage - 1}));
    }
  };

  const formatDate = (date: number): string => {
    return date ? date.toString() : 'N/A';
  };

  const headerTemplate = () => {
    const allSelected = selectedArtworks.length === artworks.length;

    return (
      <div className="flex align-items-center">
        {/* <Checkbox
          checked={allSelected}
          onChange={(e) => {
            if (e.checked) {
              setSelectedArtworks([...artworks]);
            } else {
              setSelectedArtworks([]);
            }
          }}
          className="mr-2"
        /> */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-pointer ml-2"
          onClick={(e) => op.current?.toggle(e)}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <OverlayPanel ref={op} appendTo={document.body} showCloseIcon>
          <div className="p-2">
            <InputNumber 
              value={customRowCount} 
              onValueChange={(e) => setCustomRowCount(e.value)}
              placeholder="Enter number of rows"
              min={0}
              max={totalRecords}
              className="mb-2"
            />
            <Button 
              label="Select" 
              className="p-button-sm" 
              onClick={() => {
                if (customRowCount !== null) {
                  selectRows(customRowCount);
                }
                op.current?.hide();
              }} 
            />
          </div>
        </OverlayPanel>
      </div>
    );
  };

  return (
    <div className="m-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Art Institute of Chicago Artworks</h1>
      <DataTable 
        value={artworks} 
        lazy 
        paginator 
        first={lazyState.first} 
        rows={lazyState.rows}
        totalRecords={totalRecords} 
        onPage={onPage}
        loading={loading} 
        responsiveLayout="scroll"
        selection={selectedArtworks}
        onSelectionChange={(e) => setSelectedArtworks(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{width: '3em'}} header={headerTemplate}></Column>
        <Column field="title" header="Title" sortable></Column>
        <Column field="place_of_origin" header="Place of Origin" sortable></Column>
        <Column field="artist_display" header="Artist" sortable></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Date Start" body={(rowData) => formatDate(rowData.date_start)} sortable></Column>
        <Column field="date_end" header="Date End" body={(rowData) => formatDate(rowData.date_end)} sortable></Column>
      </DataTable>
    </div>
  );
};

export default DataTablePage;