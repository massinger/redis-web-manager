import { DocumentCard, DocumentCardActions, DocumentCardDetails, DocumentCardType, Icon, Label, Stack, Text, useTheme } from '@fluentui/react';
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Connection, copyConnection, deleteConnection, getConnections, openConnection } from '../services/connection.service';
import { ErrorMessageBar } from './common/ErrorMessageBar';
import { Loading } from './common/Loading';
import { ConnectionPanel } from './panel/ConnectionPanel';

const textOverflow: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
}

export interface IConnectionListProps {
  onConnectionClick: (connection: Connection) => void
}

export const ConnectionList = (props: IConnectionListProps) => {
  const { onConnectionClick } = props;
  const { t } = useTranslation(), theme = useTheme();

  const [connections, setConnections] = useState<Array<Connection>>([]),
    [error, setError] = useState(),
    [loading, setLoading] = useState(false),
    [selectedConnection, setSelectedConnection] = useState<Connection | undefined>(),
    [showEditPanel, setShowEditPanel] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getConnections().then((data: Array<Connection>) => {
      if (data && data.length) {
        setConnections(data.sort((a, b) => Number(b.id) - Number(a.id)));
      } else {
        setConnections([]);
      }
    })
      .catch(err => setError(err))
      .finally(() => { setLoading(false) });
  }, [])

  useEffect(() => {
    load();
    return () => setSelectedConnection(undefined)
  }, [load]);

  const handleSave = () => {
    load();
  }

  const handleConnectionClick = (connection: Connection) => {
    setLoading(true);
    openConnection(connection.id).then(ret => {
      onConnectionClick && onConnectionClick(connection);
    })
      .catch(err => setError(err))
      .finally(() => { setLoading(false) });
  }

  return (<>
    <ErrorMessageBar error={error}></ErrorMessageBar>

    <Loading loading={loading} />

    <Stack horizontal wrap tokens={{ childrenGap: '10 10', padding: 10 }} horizontalAlign='center'>

      <DocumentCard key={"add"} type={DocumentCardType.compact} styles={{ root: { width: 320 } }} onClick={() => {
        setShowEditPanel(true);
        setSelectedConnection(undefined);
      }}>
        <DocumentCardDetails>
          <Stack horizontalAlign="center" verticalAlign="center" style={{ height: '100%' }}>
            <Icon iconName={'circleAdditionSolid'} styles={{ root: { color: theme.palette.themePrimary, fontSize: 40 } }}></Icon>
          </Stack>
        </DocumentCardDetails>
      </DocumentCard>

      {connections && connections.map(connection => {
        return <DocumentCard key={connection.id} type={DocumentCardType.compact} styles={{ root: { width: 320 } }} onClick={() => handleConnectionClick(connection)}>
          <DocumentCardDetails>
            <Label style={{ ...textOverflow, padding: '5px 10px' }}>{connection.name}</Label>
            {(connection.isCluster || connection.isSentinel) && (
              <Text variant='small' style={{ ...textOverflow, padding: '0 10px' }}>{connection.addrs?.join(',')}</Text>
            )}
            {!(connection.isCluster || connection.isSentinel) && (
              <Text variant='small' style={{ ...textOverflow, padding: '0 10px' }}>{`${connection.host}:${connection.port}`}</Text>
            )}
            <Stack horizontal style={{ width: '100%' }}>
              <Stack.Item grow={1}><span></span></Stack.Item>
              <DocumentCardActions actions={[
                {
                  iconProps: { iconName: 'edit' }, title: t('Edit'), disabled: loading, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedConnection({...connection});
                    setShowEditPanel(true);
                  }
                },
                {
                  iconProps: { iconName: 'copy' }, title: t('Copy'), disabled: loading, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLoading(true);
                    connection.name = `${connection.name} Copy`;
                    copyConnection(connection).then(load)
                      .catch(err => setError(err))
                      .finally(() => setLoading(false));
                  }
                },
                {
                  iconProps: { iconName: 'delete' }, title: t('Delete'), disabled: loading, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLoading(true);
                    deleteConnection(connection.id).then(() => load())
                      .catch(err => setError(err))
                      .finally(() => setLoading(false));
                  }
                }
              ]} />
            </Stack>
          </DocumentCardDetails>
        </DocumentCard>
      })}
      {/* blank fill for layout */}
      {[...Array(4)].fill(0).map((_, i) =>
        <Stack.Item key={i} styles={{ root: { width: 320 } }}><div></div></Stack.Item>
      )}
    </Stack>

    {/* <IconButton
      styles={{ root: { zIndex: 1, position: 'absolute', bottom: 20, right: 20, width: 42, height: 42, padding: 0 } }}
      iconProps={{ iconName: 'circleAdditionSolid', style: { height: 'auto', fontSize: 32 } }} onClick={() => {
        setShowEditPanel(true);
        setSelectedConnection(undefined);
      }} /> */}

    <ConnectionPanel isOpen={showEditPanel} setIsOpen={setShowEditPanel} connection={selectedConnection} onSave={handleSave} />
  </>)
}