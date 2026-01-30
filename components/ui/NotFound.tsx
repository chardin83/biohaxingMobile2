import React from 'react';
import { StyleSheet,Text } from 'react-native';

import { Colors } from '@/app/theme/Colors';

import Container from './Container';

export const NotFound = ({ text }: { text: string }) => (
 <Container background='gradient' gradientKey="sunriseUp">
         <Text style={styles.notFound}>{text ?? "Not found."}</Text>
       </Container>
);

const styles = StyleSheet.create({
    notFound: {
        fontSize: 18,
        color: Colors.dark.error,
        textAlign: 'center',
        marginTop: 50,
  },
});