
(global as any).AUTH_HEADER = undefined;
export const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'auth.header':
                return (global as any).AUTH_HEADER ? (global as any).AUTH_HEADER : defVal;
            default :
                return defVal;
        }
    })
};
