export const slotFrame = {
  name: 'Dashboards', nodes: {'1:2': {
    components: {'30:1': {name: 'Report/Tile'}},
    document: {id: '1:2', type: 'FRAME', name: 'Overview', children: [
      {id: '1:3', type: 'INSTANCE', name: 'Tile', componentId: '30:1', children: [
        {id: 'I1:3;30:2', type: 'TEXT', name: 'Heading', characters: 'Visits'},
        {id: 'I1:3;30:3', type: 'VECTOR', name: 'Divider'},
        {id: 'I1:3;30:4', type: 'SLOT', name: 'Body', children: [
          {id: 'I1:3;30:4;1:10', type: 'FRAME', name: 'Content', children: [
            {id: 'I1:3;30:4;1:11', type: 'TEXT', name: 'Value', characters: '1,204', style: {fontFamily: 'Inter', fontWeight: 600, fontSize: 18, lineHeightPx: 24}},
            {id: 'I1:3;30:4;1:12', type: 'TEXT', name: 'Draft', characters: 'Unused', visible: false},
          ]},
        ]},
      ]},
      {id: '1:4', type: 'INSTANCE', name: 'Tile', componentId: '30:1', children: [
        {id: 'I1:4;30:2', type: 'TEXT', name: 'Heading', characters: 'Orders'},
        {id: 'I1:4;30:5', type: 'FRAME', name: 'Frame', children: [
          {id: 'I1:4;30:4', type: 'SLOT', name: 'Body', children: [
            {id: 'I1:4;30:4;1:20', type: 'TEXT', name: 'Value', characters: '87'},
          ]},
        ]},
      ]},
    ]},
  }},
};
